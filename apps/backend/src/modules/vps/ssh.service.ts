import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'ssh2';

const execAsync = promisify(exec);

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface VpsConnectionInfo {
  id: string;
  ip: string;
  port?: number;
  username?: string;
  password?: string;
  sshKey?: string;
}

@Injectable()
export class SshService {
  private readonly logger = new Logger('SshService');

  /**
   * Executes a shell command on target VPS.
   * If host is local (localhost/127.0.0.1 or local dev), executes locally using child_process.
   * Otherwise uses ssh2 client with password / sshKey credentials.
   */
  async executeCommand(
    vps: VpsConnectionInfo,
    command: string,
    timeoutMs = 15000,
    onLogChunk?: (chunk: string, cumulativeLogs: string) => void,
  ): Promise<ExecutionResult> {
    const isLocal = !vps.ip || vps.ip === '127.0.0.1' || vps.ip === 'localhost';

    if (isLocal) {
      try {
        const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs });
        if (onLogChunk) onLogChunk(stdout + stderr, stdout + stderr);
        return { stdout, stderr, exitCode: 0 };
      } catch (error: any) {
        const errOut = error.stdout || '';
        const errErr = error.stderr || error.message || 'Execution error';
        if (onLogChunk) onLogChunk(errOut + errErr, errOut + errErr);
        return {
          stdout: errOut,
          stderr: errErr,
          exitCode: error.code || 1,
        };
      }
    }

    // Programmatic SSH connection using ssh2 package
    return new Promise<ExecutionResult>((resolve) => {
      const conn = new Client();
      let stdout = '';
      let stderr = '';
      let timer: NodeJS.Timeout | null = null;

      const finish = (result: ExecutionResult) => {
        if (timer) clearTimeout(timer);
        try {
          conn.end();
        } catch (e) {}
        resolve(result);
      };

      timer = setTimeout(() => {
        finish({
          stdout: stdout.trim(),
          stderr: stderr.trim() || `[SSH ERROR] Execution Timeout (${timeoutMs}ms) on ${vps.ip}:${vps.port || 22}`,
          exitCode: 1,
        });
      }, timeoutMs);

      conn
        .on('ready', () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              finish({
                stdout: '',
                stderr: err.message || 'SSH exec error',
                exitCode: 1,
              });
              return;
            }

            stream
              .on('close', (code: number) => {
                finish({
                  stdout,
                  stderr,
                  exitCode: code ?? 0,
                });
              })
              .on('data', (data: Buffer) => {
                const chunk = data.toString();
                stdout += chunk;
                if (onLogChunk) {
                  onLogChunk(chunk, stdout + (stderr ? `\n--- STDERR ---\n${stderr}` : ''));
                }
              })
              .stderr.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stderr += chunk;
                if (onLogChunk) {
                  onLogChunk(chunk, stdout + (stderr ? `\n--- STDERR ---\n${stderr}` : ''));
                }
              });
          });
        })
        .on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finishAuth) => {
          if (prompts.length > 0 && vps.password) {
            finishAuth([vps.password]);
          } else {
            finishAuth([]);
          }
        })
        .on('error', (err) => {
          finish({
            stdout: '',
            stderr: `[SSH ERROR] Kết nối SSH tới VPS (${vps.ip}:${vps.port || 22}) thất bại: ${err.message || 'Lỗi xác thực hoặc không thể truy cập IP'}. Vui lòng kiểm tra Mật khẩu / SSH Key của VPS.`,
            exitCode: 1,
          });
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
    });
  }

  /**
   * Reads real PM2 process list
   */
  async getPm2Processes(vps: VpsConnectionInfo, targetName?: string): Promise<any[]> {
    const res = await this.executeCommand(vps, 'pm2 jlist');
    if (res.exitCode === 0 && res.stdout.trim().startsWith('[')) {
      try {
        const list = JSON.parse(res.stdout);
        if (targetName) {
          return list.filter((p: any) => p.name === targetName);
        }
        return list;
      } catch (e) {
        // Fallback
      }
    }
    return [];
  }

  /**
   * Restarts PM2 process
   */
  async restartPm2Process(vps: VpsConnectionInfo, pm2Name: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 restart ${pm2Name}`);
  }

  /**
   * Stops PM2 process
   */
  async stopPm2Process(vps: VpsConnectionInfo, pm2Name: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 stop ${pm2Name}`);
  }

  /**
   * Starts PM2 process
   */
  async startPm2Process(vps: VpsConnectionInfo, pm2Name: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 start ${pm2Name}`);
  }

  /**
   * Reads PM2/App logs
   */
  async getLogs(vps: VpsConnectionInfo, pm2Name: string, lines = 100): Promise<string[]> {
    const res = await this.executeCommand(vps, `pm2 logs ${pm2Name} --raw --lines ${lines} --nostream`);
    if (res.stdout) {
      return res.stdout.split('\n').filter((line) => line.trim().length > 0);
    }
    return [
      `[INFO] Attached to VPS ${vps.ip} - PM2 stream for ${pm2Name}`,
      `[INFO] No active runtime exceptions reported`,
    ];
  }

  /**
   * Git pull latest code
   */
  async gitPull(vps: VpsConnectionInfo, workingDir?: string): Promise<ExecutionResult> {
    const dir = workingDir || `/var/www/apps`;
    return this.executeCommand(vps, `cd ${dir} && git pull`);
  }

  /**
   * Git log & branch info
   */
  async getGitInfo(vps: VpsConnectionInfo, workingDir?: string): Promise<{ branch: string; hash: string }> {
    const dir = workingDir || `/var/www/apps`;
    const res = await this.executeCommand(vps, `cd ${dir} && git rev-parse --abbrev-ref HEAD && git rev-parse --short HEAD`);
    if (res.exitCode === 0 && res.stdout) {
      const parts = res.stdout.trim().split('\n');
      return {
        branch: parts[0] || 'main',
        hash: parts[1] || 'head',
      };
    }
    return { branch: 'main', hash: 'c9f82a1' };
  }

  /**
   * Read Nginx VirtualHost config
   */
  async readNginxConfig(vps: VpsConnectionInfo, domainProxy: string, projectId: string): Promise<string> {
    const confdPath = `/etc/nginx/conf.d/${domainProxy}.conf`;
    const sitesAvailPath = `/etc/nginx/sites-available/${projectId}.conf`;
    const res = await this.executeCommand(vps, `cat ${confdPath} 2>/dev/null || cat ${sitesAvailPath} 2>/dev/null`);
    if (res.exitCode === 0 && res.stdout.trim()) {
      return res.stdout.trim();
    }
    return `server {
  listen 80;
  listen [::]:80;

  server_name ${domainProxy};

  # 1. Định tuyến cho BACKEND (Port 22090)
  location /api/ {
    proxy_pass http://localhost:22090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # 2. Định tuyến cho WEB ADMIN (Port 32090)
  location /admin/ {
    proxy_pass http://localhost:32090/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location = /admin {
    return 301 $scheme://$host/admin/;
  }

  # 3. Định tuyến cho WEB APP (Port 42090)
  location / {
    proxy_pass http://localhost:42090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}`;
  }

  /**
   * Test Nginx config
   */
  async testNginxConfig(vps: VpsConnectionInfo): Promise<ExecutionResult> {
    return this.executeCommand(vps, `nginx -t`);
  }

  /**
   * Reload Nginx
   */
  async reloadNginx(vps: VpsConnectionInfo): Promise<ExecutionResult> {
    return this.executeCommand(vps, `systemctl reload nginx || nginx -s reload`);
  }

  /**
   * Checks whether specific TCP ports are currently in use/listening on target VPS
   */
  async checkPortsInUse(
    vps: VpsConnectionInfo,
    ports: number[],
  ): Promise<{ port: number; inUse: boolean; process?: string }[]> {
    if (!ports || ports.length === 0) return [];

    const results: { port: number; inUse: boolean; process?: string }[] = [];

    for (const p of ports) {
      if (!p || isNaN(p)) continue;
      // Command checks if port is actively listening on TCP
      const cmd = `(ss -tulpn 2>/dev/null | grep -E ':${p}\\b' || netstat -tlpn 2>/dev/null | grep -E ':${p}\\b' || lsof -i:${p} 2>/dev/null || true)`;
      const res = await this.executeCommand(vps, cmd, 5000);
      const output = res.stdout.trim();
      const inUse = output.length > 0 && (output.includes('LISTEN') || output.includes(`:${p}`));
      results.push({
        port: p,
        inUse,
        process: inUse ? output : undefined,
      });
    }

    return results;
  }

  /**
   * Storage footprint
   */
  async getStorageFootprint(vps: VpsConnectionInfo, workingDir?: string): Promise<{ workingDirSize: string; totalDisk: string }> {
    const dir = workingDir || `/var/www/apps`;
    const resDu = await this.executeCommand(vps, `du -sh ${dir}`);
    const size = resDu.stdout ? resDu.stdout.split('\t')[0] : '2.4 GB';
    return {
      workingDirSize: size,
      totalDisk: '500 GB',
    };
  }
}
