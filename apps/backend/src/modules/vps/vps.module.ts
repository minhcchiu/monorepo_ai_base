import { Module } from '@nestjs/common';
import { VpsController } from './vps.controller';
import { VpsService } from './vps.service';
import { SshService } from './ssh.service';
import { VpsHeartbeatService } from './vps-heartbeat.service';
import { VpsTerminalGateway } from './vps-terminal.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VpsController],
  providers: [VpsService, SshService, VpsHeartbeatService, VpsTerminalGateway],
  exports: [VpsService, SshService, VpsHeartbeatService, VpsTerminalGateway],
})
export class VpsModule {}
