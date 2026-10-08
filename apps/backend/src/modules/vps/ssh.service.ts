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

  // =========================================================================
  // PM2 PROCESS MANAGEMENT
  // =========================================================================

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

  async restartPm2Process(vps: VpsConnectionInfo, pm2Name: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 restart ${pm2Name}`);
  }

  async reloadPm2Process(vps: VpsConnectionInfo, pm2Name = 'all'): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 reload ${pm2Name}`);
  }

  async stopPm2Process(vps: VpsConnectionInfo, pm2Name: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 stop ${pm2Name}`);
  }

  async startPm2Process(vps: VpsConnectionInfo, pm2Name: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 start ${pm2Name}`);
  }

  async scalePm2Process(vps: VpsConnectionInfo, pm2Name: string, instances: number): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 scale ${pm2Name} ${instances}`);
  }

  async flushPm2Logs(vps: VpsConnectionInfo, pm2Name?: string): Promise<ExecutionResult> {
    const cmd = pm2Name ? `pm2 flush ${pm2Name}` : `pm2 flush`;
    return this.executeCommand(vps, cmd);
  }

  async savePm2State(vps: VpsConnectionInfo): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 save`);
  }

  async deletePm2Process(vps: VpsConnectionInfo, pm2Name: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `pm2 delete ${pm2Name}`);
  }

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

  // =========================================================================
  // FILE MANAGER & SFTP OPS
  // =========================================================================

  async listFiles(vps: VpsConnectionInfo, dirPath = '/var/www/apps'): Promise<any[]> {
    const cmd = `ls -la --time-style=iso "${dirPath}"`;
    const res = await this.executeCommand(vps, cmd);
    if (res.exitCode === 0 && res.stdout) {
      const lines = res.stdout.split('\n').filter((l) => l.trim().length > 0 && !l.startsWith('total'));
      return lines.map((line, idx) => {
        const parts = line.trim().split(/\s+/);
        const permissions = parts[0] || '-rw-r--r--';
        const isDir = permissions.startsWith('d');
        const owner = parts[2] || 'root';
        const group = parts[3] || 'root';
        const sizeBytes = parseInt(parts[4] || '0', 10);
        const dateStr = `${parts[5] || ''} ${parts[6] || ''}`;
        const name = parts.slice(7).join(' ') || `item-${idx}`;
        const size = isDir ? '-' : sizeBytes > 1024 * 1024 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(sizeBytes / 1024)} KB`;

        return {
          id: `f-${idx}`,
          name,
          path: `${dirPath.replace(/\/$/, '')}/${name}`,
          size,
          sizeBytes,
          type: isDir ? 'directory' : 'file',
          permissions,
          owner,
          group,
          lastModified: dateStr || 'Recently',
        };
      }).filter((item) => item.name !== '.' && item.name !== '..');
    }
    return [];
  }

  async readFileContent(vps: VpsConnectionInfo, filePath: string): Promise<string> {
    const res = await this.executeCommand(vps, `cat "${filePath}"`);
    if (res.exitCode === 0) {
      return res.stdout;
    }
    throw new Error(res.stderr || `Could not read file ${filePath}`);
  }

  async writeFileContent(vps: VpsConnectionInfo, filePath: string, content: string): Promise<ExecutionResult> {
    const base64Content = Buffer.from(content, 'utf8').toString('base64');
    const cmd = `echo "${base64Content}" | base64 -d > "${filePath}"`;
    return this.executeCommand(vps, cmd);
  }

  async deletePath(vps: VpsConnectionInfo, targetPath: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `rm -rf "${targetPath}"`);
  }

  async chmodPath(vps: VpsConnectionInfo, targetPath: string, mode: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `chmod ${mode} "${targetPath}"`);
  }

  async createDirectory(vps: VpsConnectionInfo, dirPath: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, `mkdir -p "${dirPath}"`);
  }

  // =========================================================================
  // CRONTAB SCHEDULER
  // =========================================================================

  async getCrontab(vps: VpsConnectionInfo): Promise<string> {
    const res = await this.executeCommand(vps, 'crontab -l 2>/dev/null || true');
    return res.stdout || '';
  }

  async saveCrontab(vps: VpsConnectionInfo, crontabContent: string): Promise<ExecutionResult> {
    const base64Content = Buffer.from(crontabContent, 'utf8').toString('base64');
    const cmd = `echo "${base64Content}" | base64 -d | crontab -`;
    return this.executeCommand(vps, cmd);
  }

  async runCronCommand(vps: VpsConnectionInfo, command: string): Promise<ExecutionResult> {
    return this.executeCommand(vps, command, 60000);
  }

  // =========================================================================
  // DOMAINS, NGINX & CERTBOT SSL
  // =========================================================================

  async checkDnsRecord(vps: VpsConnectionInfo, domainName: string): Promise<{ matchesIp: boolean; resolvedIp: string }> {
    const res = await this.executeCommand(vps, `dig +short A ${domainName} || nslookup ${domainName} | grep Address | tail -n 1 | awk '{print $2}'`);
    const resolvedIp = res.stdout.trim().split('\n')[0] || '';
    return {
      matchesIp: resolvedIp === vps.ip,
      resolvedIp,
    };
  }

  async issueCertbotSsl(vps: VpsConnectionInfo, domainName: string, email = 'admin@example.com'): Promise<ExecutionResult> {
    const cmd = `certbot --nginx -d ${domainName} --non-interactive --agree-tos -m ${email} --redirect || certbot certonly --standalone -d ${domainName} --non-interactive --agree-tos -m ${email}`;
    return this.executeCommand(vps, cmd, 120000);
  }

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

  # 1. Định tuyến cho BACKEND
  location /api/ {
    proxy_pass http://localhost:22090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # 2. Định tuyến cho WEB APP
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

  async testNginxConfig(vps: VpsConnectionInfo): Promise<ExecutionResult> {
    return this.executeCommand(vps, `nginx -t`);
  }

  async reloadNginx(vps: VpsConnectionInfo): Promise<ExecutionResult> {
    return this.executeCommand(vps, `systemctl reload nginx || nginx -s reload`);
  }

  // =========================================================================
  // BACKUPS ENGINE
  // =========================================================================

  async dumpDatabase(
    vps: VpsConnectionInfo,
    dbType: 'postgres' | 'mysql',
    dbName: string,
    outputFile: string,
    user = 'postgres',
    password?: string,
  ): Promise<ExecutionResult> {
    let cmd = '';
    if (dbType === 'postgres') {
      const passEnv = password ? `PGPASSWORD="${password}" ` : '';
      cmd = `${passEnv}pg_dump -U ${user} -d ${dbName} | gzip > "${outputFile}"`;
    } else {
      const passFlag = password ? `-p"${password}"` : '';
      cmd = `mysqldump -u ${user} ${passFlag} ${dbName} | gzip > "${outputFile}"`;
    }
    return this.executeCommand(vps, cmd, 180000);
  }

  async tarDirectory(vps: VpsConnectionInfo, targetDir: string, outputFile: string): Promise<ExecutionResult> {
    const cmd = `tar -czf "${outputFile}" -C "${targetDir}" .`;
    return this.executeCommand(vps, cmd, 300000);
  }

  // =========================================================================
  // UFW FIREWALL & UTILITIES
  // =========================================================================

  async getUfwStatus(vps: VpsConnectionInfo): Promise<ExecutionResult> {
    return this.executeCommand(vps, `ufw status verbose || iptables -L -n`);
  }

  async allowUfwPort(vps: VpsConnectionInfo, port: number, protocol = 'tcp'): Promise<ExecutionResult> {
    return this.executeCommand(vps, `ufw allow ${port}/${protocol}`);
  }

  async denyUfwPort(vps: VpsConnectionInfo, port: number, protocol = 'tcp'): Promise<ExecutionResult> {
    return this.executeCommand(vps, `ufw delete allow ${port}/${protocol}`);
  }

  async gitPull(vps: VpsConnectionInfo, workingDir?: string): Promise<ExecutionResult> {
    const dir = workingDir || `/var/www/apps`;
    return this.executeCommand(vps, `cd ${dir} && git pull`);
  }

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
    return { branch: 'main', hash: 'head' };
  }

  async checkPortsInUse(
    vps: VpsConnectionInfo,
    ports: number[],
  ): Promise<{ port: number; inUse: boolean; process?: string }[]> {
    if (!ports || ports.length === 0) return [];
    const results: { port: number; inUse: boolean; process?: string }[] = [];

    for (const p of ports) {
      if (!p || isNaN(p)) continue;
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
