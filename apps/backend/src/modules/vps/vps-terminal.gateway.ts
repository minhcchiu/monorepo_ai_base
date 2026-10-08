import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Client } from 'ssh2';
import { VpsService } from './vps.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/terminal',
})
export class VpsTerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('VpsTerminalGateway');
  private sshClients = new Map<string, { conn: Client; stream: any }>();

  constructor(private readonly vpsService: VpsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Terminal WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Terminal WS client disconnected: ${client.id}`);
    const active = this.sshClients.get(client.id);
    if (active) {
      try {
        active.conn.end();
      } catch (e) {}
      this.sshClients.delete(client.id);
    }
  }

  @SubscribeMessage('init-terminal')
  async handleInitTerminal(client: Socket, payload: { vpsId: string; cols?: number; rows?: number }) {
    try {
      const vps = await this.vpsService.findOne(payload.vpsId);
      if (!vps) {
        client.emit('output', `\r\n\x1b[31m[ERROR] VPS Node ${payload.vpsId} not found\x1b[0m\r\n`);
        return;
      }

      client.emit('output', `\r\n\x1b[32mConnecting to SSH Shell [${vps.name} - ${vps.ip}:${vps.port || 22}]...\x1b[0m\r\n`);

      const conn = new Client();
      conn
        .on('ready', () => {
          conn.shell(
            {
              term: 'xterm-256color',
              cols: payload.cols || 80,
              rows: payload.rows || 24,
            },
            (err, stream) => {
              if (err) {
                client.emit('output', `\r\n\x1b[31m[SSH Shell Error] ${err.message}\x1b[0m\r\n`);
                conn.end();
                return;
              }

              this.sshClients.set(client.id, { conn, stream });

              stream
                .on('data', (data: Buffer) => {
                  client.emit('output', data.toString('utf8'));
                })
                .on('close', () => {
                  client.emit('output', '\r\n\x1b[33m[SSH Connection Closed]\x1b[0m\r\n');
                  this.sshClients.delete(client.id);
                  conn.end();
                });
            },
          );
        })
        .on('error', (err) => {
          client.emit('output', `\r\n\x1b[31m[SSH Auth/Connection Failed] ${err.message}\x1b[0m\r\n`);
        })
        .connect({
          host: vps.ip,
          port: vps.port || 22,
          username: vps.username || 'root',
          password: vps.password || undefined,
          privateKey: vps.sshKey ? vps.sshKey : undefined,
          readyTimeout: 10000,
          tryKeyboard: true,
        });
    } catch (e: any) {
      client.emit('output', `\r\n\x1b[31m[System Exception] ${e.message}\x1b[0m\r\n`);
    }
  }

  @SubscribeMessage('input')
  handleTerminalInput(client: Socket, data: string) {
    const active = this.sshClients.get(client.id);
    if (active && active.stream) {
      active.stream.write(data);
    }
  }

  @SubscribeMessage('resize')
  handleTerminalResize(client: Socket, payload: { cols: number; rows: number }) {
    const active = this.sshClients.get(client.id);
    if (active && active.stream && active.stream.setWindow) {
      active.stream.setWindow(payload.rows, payload.cols, 0, 0);
    }
  }
}
