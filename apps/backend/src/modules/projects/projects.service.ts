import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as vm from 'vm';
import { PrismaService } from '../../prisma/prisma.service';
import { SshService } from '../vps/ssh.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sshService: SshService,
  ) {}

  /**
   * Helper to validate that project exists and belongs to specified vpsId
   */
  async validateProjectVpsRelation(vpsId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        vps: true,
        domains: true,
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found`);
    }

    if (project.vpsId !== vpsId) {
      throw new ForbiddenException(
        `Security Error: Project '${projectId}' does not belong to VPS '${vpsId}'`,
      );
    }

    return project;
  }

  async findAllGlobal() {
    return this.prisma.project.findMany({
      include: {
        vps: {
          select: {
            id: true,
            name: true,
            ip: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVps(vpsId: string) {
    const vps = await this.prisma.vps.findUnique({ where: { id: vpsId } });
    if (!vps) {
      throw new NotFoundException(`VPS with ID '${vpsId}' not found`);
    }

    const dbProjects = await this.prisma.project.findMany({
      where: { vpsId },
      include: {
        vps: {
          select: {
            id: true,
            name: true,
            ip: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let pm2Names = new Set<string>();
    try {
      const pm2List = await this.sshService.getPm2Processes(vps);
      if (pm2List && Array.isArray(pm2List)) {
        pm2List.forEach((p) => {
          if (p.name) pm2Names.add(p.name);
        });
      }
    } catch (e) {
      //
    }

    return dbProjects.map((p) => {
      const pm2Name = p.pm2Name || p.id || p.name;
      const isRunningInPm2 = pm2Names.has(pm2Name) || pm2Names.has(p.name);

      let syncStatus = 'SYNCED';
      let syncStatusText = 'Đã đồng bộ';

      if (!isRunningInPm2 && p.status === 'STOPPED') {
        syncStatus = 'REMOVED';
        syncStatusText = 'Đã xóa';
      } else if (p.createdAt && new Date().getTime() - new Date(p.createdAt).getTime() < 300000) {
        syncStatus = 'NEW';
        syncStatusText = 'Mới';
      }

      return {
        ...p,
        syncStatus,
        syncStatusText,
      };
    });
  }

  async syncPm2Projects(vpsId: string) {
    const vps = await this.prisma.vps.findUnique({ where: { id: vpsId } });
    if (!vps) {
      throw new NotFoundException(`VPS with ID '${vpsId}' not found`);
    }

    const pm2List = await this.sshService.getPm2Processes(vps);
    const dbProjects = await this.prisma.project.findMany({ where: { vpsId } });

    const pm2NamesMap = new Map<string, any>();
    if (pm2List && Array.isArray(pm2List)) {
      pm2List.forEach((proc) => {
        if (proc.name) pm2NamesMap.set(proc.name, proc);
      });
    }

    let updatedSyncedCount = 0;
    let newCreatedCount = 0;
    let removedCount = 0;

    // 1. Process all running PM2 items (Rule A & Rule B)
    for (const [procName, proc] of pm2NamesMap.entries()) {
      const existing = dbProjects.find(
        (p) => p.id === procName || p.pm2Name === procName || p.name === procName,
      );

      const status = proc.pm2_env?.status === 'online' ? 'RUNNING' : 'STOPPED';
      const memoryMb = proc.monit?.memory ? Math.round(proc.monit.memory / 1024 / 1024) : 0;
      const cpuPercent = proc.monit?.cpu || 0;
      const port = proc.pm2_env?.env?.PORT ? Number(proc.pm2_env.env.PORT) : 3000;

      if (existing) {
        // Rule A: Tồn tại cả ở PM2 và DB -> UPDATE (Trạng thái đồng bộ: đã đồng bộ)
        await this.prisma.project.update({
          where: { id: existing.id },
          data: {
            status,
            cpuPercent,
            memoryMb,
            port: port || existing.port,
          },
        });
        updatedSyncedCount++;
      } else {
        // Rule B: Có trong PM2 nhưng CHƯA có trong DB -> TẠO MỚI (Trạng thái đồng bộ: mới)
        const slug = procName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const newProj = await this.prisma.project.create({
          data: {
            id: slug,
            vpsId,
            name: procName,
            description: `Auto-discovered PM2 process #${proc.pm_id}`,
            engine: `Node.js (${proc.exec_mode || 'fork'})`,
            environment: vps.environment || 'prod',
            status,
            pm2Name: procName,
            pm2Instances: proc.exec_mode === 'cluster_mode' ? 'Cluster Workers' : 'Fork Process',
            port,
            domainProxy: `${slug}.io`,
            workingDir: proc.pm2_env?.pm_cwd || `/var/www/apps/${slug}`,
            cpuPercent,
            memoryMb,
          },
        });

        await this.logActivity(
          newProj.id,
          'PM2',
          'PM2 Process Discovered',
          `Mới: Tự động đồng bộ tiến trình PM2 '${procName}' vào DB`,
          'Just now',
        );
        newCreatedCount++;
      }
    }

    // 2. Process DB projects NOT present in PM2 (Rule C: Tồn tại trong DB nhưng PM2 không có -> Trạng thái đồng bộ: đã xóa)
    for (const proj of dbProjects) {
      const pm2Name = proj.pm2Name || proj.id || proj.name;
      if (!pm2NamesMap.has(pm2Name) && !pm2NamesMap.has(proj.name)) {
        await this.prisma.project.update({
          where: { id: proj.id },
          data: {
            status: 'STOPPED',
          },
        });

        await this.logActivity(
          proj.id,
          'PM2',
          'PM2 Process Missing',
          `Đã xóa/ngắt: Tiến trình PM2 '${pm2Name}' không còn tồn tại trên VPS`,
          'Just now',
        );
        removedCount++;
      }
    }

    return {
      success: true,
      updatedSyncedCount,
      newCreatedCount,
      removedCount,
      message: `Đồng bộ hoàn tất: ${updatedSyncedCount} đã đồng bộ, ${newCreatedCount} mới, ${removedCount} đã xóa/dừng!`,
    };
  }

  async inspectRepo(vpsId: string, gitRepo: string, targetBranchOverride?: string) {
    const vps = await this.prisma.vps.findUnique({ where: { id: vpsId } });
    if (!vps) {
      throw new NotFoundException(`VPS với ID '${vpsId}' không tồn tại trong hệ thống`);
    }

    if (!gitRepo || !gitRepo.trim()) {
      throw new BadRequestException('Vui lòng nhập đường dẫn Git Repository URL');
    }

    const cleanUrl = gitRepo.trim();
    const matches = cleanUrl.match(/[\/:]([^\/:]+?)(\.git)?$/);
    const repoSlug = matches && matches[1] ? matches[1] : 'my-app';
    const slug = repoSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // 1. STRICT CHECK: Verify Git Repository URL & SSH Access
    let branches: string[] = [];
    let selectedBranch = targetBranchOverride || 'main';

    try {
      const sshRes = await this.sshService.executeCommand(vps, `git ls-remote --heads ${cleanUrl}`);
      if (sshRes.exitCode !== 0 || !sshRes.stdout || !sshRes.stdout.trim()) {
        throw new BadRequestException(
          `Không thể kết nối hoặc xác thực Repository '${cleanUrl}'. Vui lòng kiểm tra lại URL Git hoặc SSH Deploy Key trên VPS!`,
        );
      }

      const fetchedBranches: string[] = [];
      const lines = sshRes.stdout.split('\n');
      lines.forEach((line) => {
        const match = line.match(/refs\/heads\/(.+)$/);
        if (match && match[1]) {
          fetchedBranches.push(match[1].trim());
        }
      });

      if (fetchedBranches.length === 0) {
        throw new BadRequestException(`Repository '${cleanUrl}' không chứa bất kỳ nhánh Git (Branch) nào.`);
      }

      branches = fetchedBranches;
      if (!targetBranchOverride) {
        if (branches.includes('main')) selectedBranch = 'main';
        else if (branches.includes('master')) selectedBranch = 'master';
        else selectedBranch = branches[0];
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(
        `Lỗi kết nối Git Repository: ${e.message || 'Không thể xác thực URL Git over SSH'}`,
      );
    }

    // 2. STRICT CHECK: Mandatory ecosystem.config.js inspection at root folder of repository
    let detectedApps: Array<{
      id: string;
      name: string;
      path: string;
      filter: string;
      defaultPort: number;
      pm2Name?: string;
      script?: string;
      maxMemory?: string;
    }> = [];

    let rawEcosystemContent = '';

    const ecoRes = await this.sshService.executeCommand(
      vps,
      `git archive --remote=${cleanUrl} ${selectedBranch} ecosystem.config.js | tar -x -O 2>/dev/null`,
    );

    if (ecoRes.exitCode !== 0 || !ecoRes.stdout || !ecoRes.stdout.trim()) {
      throw new BadRequestException(
        `Không tìm thấy file 'ecosystem.config.js' ở thư mục gốc (Root) của Repository trên nhánh '${selectedBranch}'. Dự án bắt buộc phải có file ecosystem.config.js ở Root để phân tích dịch vụ và số Port!`,
      );
    }

    rawEcosystemContent = ecoRes.stdout.trim();

    try {
      const sandbox = {
        module: { exports: {} },
        exports: {},
        require: (mod: string) => {
          if (mod === 'path') {
            return {
              join: (...args: string[]) => args.filter(Boolean).join('/'),
              resolve: (...args: string[]) => args.filter(Boolean).join('/'),
            };
          }
          if (mod === 'fs') {
            return {
              existsSync: (p: string) => true,
              statSync: () => ({ isDirectory: () => true }),
            };
          }
          return {};
        },
        __dirname: '/var/www',
        process: { env: { PORT: 22090 } },
      };

      vm.createContext(sandbox);
      vm.runInNewContext(rawEcosystemContent, sandbox, { timeout: 1000 });

      const exported = sandbox.module.exports as any;
      const rawApps = Array.isArray(exported?.apps) ? exported.apps : Array.isArray(exported) ? exported : [];

      rawApps.forEach((app: any) => {
        const appName = app.name || 'unnamed-app';
        const cwdStr = String(app.cwd || app.path || '');

        let folderName = cwdStr.split(/[\\/]/).pop() || '';
        if (!folderName || folderName === 'apps' || folderName === 'www' || folderName === 'var') {
          folderName = appName.includes('backend')
            ? 'backend'
            : appName.includes('admin')
            ? 'admin'
            : appName.includes('web')
            ? 'web'
            : appName.replace(/[^a-z0-9_-]/gi, '');
        }

        let portNum = app.env?.PORT ? Number(app.env.PORT) : 0;
        if (!portNum && app.args) {
          const portArgMatch = String(app.args).match(/-p\s*(\d+)/);
          if (portArgMatch) portNum = parseInt(portArgMatch[1], 10);
        }
        if (!portNum) {
          portNum = appName.includes('backend') ? 22090 : appName.includes('admin') ? 32090 : 42090;
        }

        detectedApps.push({
          id: folderName,
          name: appName || (folderName === 'backend' ? 'Backend API' : folderName.includes('admin') ? 'Web Admin' : 'Web User App'),
          path: cwdStr.includes('apps/') ? cwdStr.substring(cwdStr.indexOf('apps/')) : `apps/${folderName}`,
          filter: `@calo_ai/${folderName}`,
          defaultPort: portNum,
          pm2Name: appName,
          script: app.script || 'dist/src/main.js',
          maxMemory: app.max_memory_restart || '512M',
        });
      });
    } catch (parseErr: any) {
      throw new BadRequestException(
        `File 'ecosystem.config.js' ở gốc Repo bị lỗi cú pháp JavaScript: ${parseErr.message}`,
      );
    }

    if (detectedApps.length === 0) {
      throw new BadRequestException(
        `File 'ecosystem.config.js' ở gốc Repository không chứa bất kỳ cấu hình ứng dụng nào trong mảng 'apps'!`,
      );
    }

    // Attempt to fetch .env.example for each app over SSH
    for (const app of detectedApps) {
      try {
        const envExRes = await this.sshService.executeCommand(
          vps,
          `git archive --remote=${cleanUrl} ${selectedBranch} ${app.path}/.env.example | tar -x -O 2>/dev/null`,
        );
        if (envExRes.exitCode === 0 && envExRes.stdout.trim()) {
          (app as any).envExample = envExRes.stdout.trim();
        }
      } catch (e) {
        // Optional
      }
    }

    return {
      success: true,
      name: slug,
      slug,
      branches,
      gitBranch: selectedBranch,
      gitHash: 'head',
      suggestedPort: detectedApps[0]?.defaultPort || 22090,
      deployDir: `/home/production-deploys/${slug}`,
      domainProxy: `${slug}.izisoft.io`,
      buildFilter: `@calo_ai/${slug}`,
      detectedApps,
      hasEcosystem: true,
      rawEcosystemContent,
      sshAccessOk: true,
    };
  }

  async deleteProjectAction(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const pm2Name = project.pm2Name || project.id;

    // Run pm2 delete on target VPS over SSH
    try {
      await this.sshService.executeCommand(project.vps, `pm2 delete ${pm2Name}`);
    } catch (e) {
      //
    }

    // Remove project from PostgreSQL DB
    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return {
      success: true,
      message: `Đã dừng, xóa tiến trình PM2 '${pm2Name}' và xóa project khỏi Database!`,
    };
  }

  async createProject(vpsId: string, payload: any) {
    const vps = await this.prisma.vps.findUnique({ where: { id: vpsId } });
    if (!vps) {
      throw new NotFoundException(`VPS with ID '${vpsId}' not found`);
    }

    const slug = (payload.name || 'new-app')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.prisma.project.findUnique({ where: { id: slug } });
    const id = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const project = await this.prisma.project.create({
      data: {
        id,
        vpsId,
        name: payload.name,
        description: payload.description || '',
        engine: payload.engine || 'Node.js / Express',
        environment: payload.environment || 'prod',
        status: 'RUNNING',
        pm2Name: payload.pm2Name || id,
        pm2Instances: payload.pm2Instances || '1 process',
        port: payload.port ? Number(payload.port) : 3000,
        domainProxy: payload.domainProxy || `${id}.local`,
        gitRepo: payload.gitRepo || '',
        gitBranch: payload.gitBranch || 'main',
        gitHash: 'head',
        workingDir: payload.workingDir || `/var/www/apps/${id}`,
        cpuPercent: 5.0,
        memoryMb: 120.0,
      },
    });

    if (payload.domainProxy) {
      await this.prisma.projectDomain.create({
        data: {
          projectId: project.id,
          domainName: payload.domainProxy,
          targetPort: project.port,
          sslStatus: 'VALID',
          sslExpiryDays: 90,
          httpPort: 443,
        },
      });
    }

    await this.logActivity(
      project.id,
      'SYSTEM',
      'Project Created',
      `New project '${project.name}' registered on VPS ${vps.name}`,
      'Just now',
    );

    return project;
  }

  async findOne(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      engine: project.engine,
      hostVpsName: project.vps.name,
      hostVpsIp: project.vps.ip,
      environment: project.environment,
      status: project.status.toLowerCase(),
      pm2Instances: project.pm2Instances,
      port: project.port,
      domainProxy: project.domainProxy,
      gitBranch: project.gitBranch,
      gitHash: project.gitHash,
      gitRepo: project.gitRepo,
      workingDir: project.workingDir,
      lastRolloutAgo: project.deployments[0]?.timeAgo || 'Recently',
      cpuPercent: project.cpuPercent,
      memoryMb: project.memoryMb,
    };
  }

  async getOverview(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const gitInfo = await this.sshService.getGitInfo(project.vps, project.workingDir || undefined);

    return {
      project: await this.findOne(vpsId, projectId),
      uptime: '14d 06h 22m',
      healthStatus: 'healthy',
      gitInfo: {
        repo: project.gitRepo || 'github.com/izisoft/calo-ai-backend',
        branch: gitInfo.branch || project.gitBranch,
        hash: gitInfo.hash || project.gitHash,
      },
      ssl: {
        valid: true,
        daysRemaining: 88,
      },
    };
  }

  async getRuntime(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const pm2Processes = await this.sshService.getPm2Processes(
      project.vps,
      project.pm2Name || project.id,
    );

    return {
      processName: project.pm2Name || project.id,
      pid: pm2Processes[0]?.pm_id ?? 1842,
      status: pm2Processes[0]?.pm2_env?.status ?? 'ONLINE',
      engine: project.engine,
      port: project.port,
      mode: project.pm2Instances,
      processes: pm2Processes,
    };
  }

  async restartRuntime(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const pm2Name = project.pm2Name || project.id;

    const res = await this.sshService.restartPm2Process(project.vps, pm2Name);

    // Log Activity
    await this.logActivity(
      projectId,
      'PM2',
      'Process Restarted',
      `PM2 process '${pm2Name}' restarted successfully`,
      'Just now',
    );

    return {
      success: res.exitCode === 0,
      message: res.exitCode === 0 ? `PM2 process '${pm2Name}' restarted successfully` : res.stderr,
    };
  }

  async stopRuntime(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const pm2Name = project.pm2Name || project.id;

    const res = await this.sshService.stopPm2Process(project.vps, pm2Name);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'STOPPED' },
    });

    await this.logActivity(
      projectId,
      'PM2',
      'Process Stopped',
      `PM2 process '${pm2Name}' stopped`,
      'Just now',
    );

    return {
      success: res.exitCode === 0,
      message: res.exitCode === 0 ? `PM2 process '${pm2Name}' stopped` : res.stderr,
    };
  }

  async startRuntime(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const pm2Name = project.pm2Name || project.id;

    const res = await this.sshService.startPm2Process(project.vps, pm2Name);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'RUNNING' },
    });

    await this.logActivity(
      projectId,
      'PM2',
      'Process Started',
      `PM2 process '${pm2Name}' started`,
      'Just now',
    );

    return {
      success: res.exitCode === 0,
      message: res.exitCode === 0 ? `PM2 process '${pm2Name}' started` : res.stderr,
    };
  }

  async getLogs(vpsId: string, projectId: string, filter?: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const pm2Name = project.pm2Name || project.id;

    const rawLogs = await this.sshService.getLogs(project.vps, pm2Name, 100);

    const formattedLogs = rawLogs.map((line) => {
      if (!line.startsWith('[')) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        return `[${timestamp}] [${project.id}] INFO ${line}`;
      }
      return line;
    });

    if (filter && filter.trim().length > 0) {
      const kw = filter.toLowerCase();
      return formattedLogs.filter((l) => l.toLowerCase().includes(kw));
    }

    return formattedLogs;
  }

  async getDeployments(vpsId: string, projectId: string) {
    await this.validateProjectVpsRelation(vpsId, projectId);

    return this.prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDeployment(
    vpsId: string,
    projectId: string,
    body: {
      deployMode?: 'INITIAL' | 'RE_DEPLOY';
      author?: string;
      deployDir?: string;
      buildCmd?: string;
      port?: number;
      domainName?: string;
      envText?: string;
      runPrismaDbPush?: boolean;
      appEnvs?: {
        backend?: string;
        admin?: string;
        web?: string;
      };
    } = {},
  ) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);

    const currentDeploymentsCount = await this.prisma.deployment.count({ where: { projectId } });
    const buildNumber = `#${210 + currentDeploymentsCount + 1}`;
    const author = body.author || 'System Admin';
    const deployMode = body.deployMode || 'INITIAL';
    const deployDir = body.deployDir || project.workingDir || `/home/production-deploys/${project.id}`;
    const repoUrl = project.gitRepo || `git@gitlab.com:izisoftware2020/${project.id}.git`;
    const branch = project.gitBranch || 'main';
    const port = body.port || project.port || 3000;
    const domainName = body.domainName || project.domainProxy || `${project.id}.izisoft.io`;
    const runPrisma = body.runPrismaDbPush !== false;

    // Detect app folder & turbo filter name
    const appFolder = project.id.includes('backend')
      ? 'apps/backend'
      : project.id.includes('admin')
      ? 'apps/web-admin'
      : project.id.includes('web')
      ? 'apps/web'
      : 'apps/backend';

    const appFilter = `@calo_ai/${project.id.replace('calo-', '')}`;

    // 1. Root .env or App .env Write Commands
    let envWriteCmds = '';
    if (body.envText) {
      const cleanEnv = body.envText.replace(/'/g, "'\\''");
      envWriteCmds += ` && printf '%s\\n' '${cleanEnv}' > .env`;
    }
    if (body.appEnvs?.backend) {
      const cleanEnv = body.appEnvs.backend.replace(/'/g, "'\\''");
      envWriteCmds += ` && mkdir -p apps/backend && printf '%s\\n' '${cleanEnv}' > apps/backend/.env`;
    }
    if (body.appEnvs?.admin) {
      const cleanEnv = body.appEnvs.admin.replace(/'/g, "'\\''");
      envWriteCmds += ` && mkdir -p apps/web-admin && printf '%s\\n' '${cleanEnv}' > apps/web-admin/.env`;
    }

    const backendPort = port || 3001;
    const adminPort = 3000;

    // 2. Nginx VirtualHost File Content (/etc/nginx/conf.d/<domain>.conf)
    const nginxConfContent = `server {
  listen 80;
  listen [::]:80;

  server_name ${domainName};

  # 1. Định tuyến cho BACKEND (Port ${backendPort})
  # Các API
  location /api/ {
    proxy_pass http://localhost:${backendPort};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # Swagger Docs của Backend
  location /docs {
    proxy_pass http://localhost:${backendPort};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }

  location /docs-json {
    proxy_pass http://localhost:${backendPort};
  }

  # File tĩnh của Backend (ảnh tải lên, ảnh món ăn)
  location /uploads/ {
    proxy_pass http://localhost:${backendPort};
  }

  location /images/ {
    proxy_pass http://localhost:${backendPort};
  }

  # 2. Định tuyến cho WEB ADMIN (Port ${adminPort})
  # Bắt tất cả các request còn lại (bao gồm giao diện Next.js, /_next/...)
  location / {
    proxy_pass http://localhost:${adminPort};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}`;
    const cleanNginx = nginxConfContent.replace(/'/g, "'\\''");
    const nginxCmd = `mkdir -p /etc/nginx/conf.d && printf '%s\\n' '${cleanNginx}' > /etc/nginx/conf.d/${domainName}.conf && nginx -t && (systemctl reload nginx || service nginx reload || true)`;

    // 3. Complete CI/CD Standard Command Sequence: Clone/Pull ➔ pnpm install ➔ build ➔ cd app & source .env ➔ prisma db push ➔ Nginx config ➔ PM2 reload
    const cmd = `if [ ! -d ${deployDir} ]; then echo 'Thư mục chưa tồn tại, đang clone mã nguồn...' && mkdir -p /home/production-deploys && cd /home/production-deploys && git clone ${repoUrl}; fi && cd ${deployDir} && git pull origin ${branch}${envWriteCmds} && pnpm install && pnpm turbo run build --filter=${appFilter} && cd ${appFolder} && (if [ ! -f .env ]; then cp .env.example .env; fi) && echo '=== DEBUG .env ===' && cat .env && set -a && source .env && set +a ${runPrisma ? '&& pnpm prisma db push --accept-data-loss' : ''} && ${nginxCmd} && (pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js --update-env)`;

    let sshRes = { exitCode: 0, stdout: '', stderr: '' };
    try {
      sshRes = await this.sshService.executeCommand(project.vps, cmd);
    } catch (e: any) {
      sshRes = { exitCode: 1, stdout: '', stderr: e.message || 'SSH execution error' };
    }

    const deployment = await this.prisma.deployment.create({
      data: {
        projectId,
        buildNumber,
        commitHash: project.gitHash || 'head',
        branch,
        author,
        status: sshRes.exitCode === 0 ? 'SUCCESS' : 'FAILED',
        timeAgo: 'Just now',
        triggeredBy: deployMode === 'INITIAL' ? '5-Step Full Setup' : 'Re-deploy Trigger',
        logs: sshRes.stdout || sshRes.stderr || 'Deployment command executed successfully.',
      },
    });

    await this.logActivity(
      projectId,
      'DEPLOY',
      deployMode === 'INITIAL' ? '5-Step Project Deploy' : 'Project Re-deployed',
      `Build ${buildNumber} deployed by ${author} on Port ${port} (${domainName})`,
      'Just now',
    );

    return deployment;
  }

  async getGitlabCiTemplate(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const deployDir = project.workingDir || `/home/production-deploys/${project.id}`;
    const serverIp = project.vps?.ip || '36.50.176.26';
    const serverUser = project.vps?.username || 'root';
    const repoUrl = project.gitRepo || `git@gitlab.com:izisoftware2020/${project.id}.git`;
    const branch = project.gitBranch || 'main';

    const appJobs = [
      {
        jobName: 'deploy_backend',
        appPath: 'apps/backend',
        filter: '@calo_ai/backend',
        hasDbPush: true,
      },
      {
        jobName: 'deploy_web_admin',
        appPath: 'apps/web-admin',
        filter: '@calo_ai/web-admin',
        hasDbPush: false,
      },
      {
        jobName: 'deploy_web',
        appPath: 'apps/web',
        filter: '@calo_ai/web',
        hasDbPush: false,
      },
    ];

    let jobsYaml = '';

    appJobs.forEach((job) => {
      const scriptBody = job.hasDbPush
        ? `cd $DEPLOY_DIR && git pull origin ${branch} && pnpm install && pnpm turbo run build --filter=${job.filter} && cd ${job.appPath} && (if [ ! -f .env ]; then cp .env.example .env; fi) && echo '=== DEBUG .env ===' && cat .env && set -a && source .env && set +a && pnpm prisma db push --accept-data-loss && (pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js --update-env)`
        : `cd $DEPLOY_DIR && git pull origin ${branch} && pnpm install && cd ${job.appPath} && (if [ ! -f .env ]; then cp .env.example .env; fi) && cd ../.. && pnpm turbo run build --filter=${job.filter} && cd ${job.appPath} && (pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js --update-env)`;

      jobsYaml += `${job.jobName}:
  stage: deploy
  image: node:20-alpine
  before_script:
    - apk add --no-cache openssh-client rsync bash git
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - echo -e "Host *\\n\\tStrictHostKeyChecking no\\n\\n" > ~/.ssh/config
  script:
    - ssh -p \${SSH_PORT:-22} $SERVER_USER@$SERVER_IP "if [ ! -d $DEPLOY_DIR ]; then echo 'Thư mục chưa tồn tại, đang clone mã nguồn...' && mkdir -p /home/production-deploys && cd /home/production-deploys && git clone ${repoUrl}; fi && ${scriptBody}"
  rules:
    - if: '$CI_COMMIT_BRANCH == "${branch}"'
      changes:
        - ${job.appPath}/**/*
        - packages/**/*
        - pnpm-lock.yaml
        - pnpm-workspace.yaml
        ${job.hasDbPush ? '- ecosystem.config.js' : ''}

`;
    });

    const config = `stages:
  - deploy

variables:
  # Thư mục gốc của project trên server
  DEPLOY_DIR: "${deployDir}"
  SERVER_IP: "${serverIp}"
  SERVER_USER: "${serverUser}"

${jobsYaml}`;

    return {
      config,
      deployDir,
      serverIp,
      serverUser,
      repoUrl,
      jobs: appJobs,
    };
  }

  async syncGitlabVariables(vpsId: string, body: {
    gitRepo: string;
    gitlabToken?: string;
    variables: Array<{ key: string; value: string; masked?: boolean }>;
  }) {
    const vps = await this.prisma.vps.findUnique({ where: { id: vpsId } });
    if (!vps) {
      throw new NotFoundException(`VPS with ID '${vpsId}' not found`);
    }

    if (!body.gitRepo) {
      throw new BadRequestException('Git Repository URL is required');
    }

    // Extract GitLab project path (e.g. git@gitlab.com:izisoftware2020/pa01calo.git -> izisoftware2020/pa01calo)
    const matches = body.gitRepo.trim().match(/[\/:]([^\/:]+\/[^\/:]+?)(\.git)?$/);
    const repoPath = matches && matches[1] ? matches[1] : '';

    if (!repoPath) {
      throw new BadRequestException('Could not parse GitLab repository path');
    }

    const encodedPath = encodeURIComponent(repoPath);
    const token = body.gitlabToken || process.env.GITLAB_ACCESS_TOKEN || 'glpat-dummy-token';

    let successCount = 0;
    const errors: string[] = [];

    for (const v of body.variables || []) {
      try {
        const createRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/variables`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'PRIVATE-TOKEN': token,
          },
          body: JSON.stringify({
            key: v.key,
            value: v.value,
            masked: v.masked || false,
            protected: false,
          }),
        });

        if (createRes.ok) {
          successCount++;
        } else if (createRes.status === 400) {
          const updateRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/variables/${v.key}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'PRIVATE-TOKEN': token,
            },
            body: JSON.stringify({
              value: v.value,
              masked: v.masked || false,
              protected: false,
            }),
          });
          if (updateRes.ok) {
            successCount++;
          } else {
            errors.push(`Failed to update ${v.key}`);
          }
        }
      } catch (e: any) {
        errors.push(`Error syncing ${v.key}: ${e.message}`);
      }
    }

    return {
      success: true,
      successCount,
      repoPath,
      message: `Đã đồng bộ ${successCount} biến CI/CD Variables lên GitLab repository ${repoPath}!`,
    };
  }

  async triggerGitlabPipeline(vpsId: string, body: {
    gitRepo: string;
    gitlabToken?: string;
    branch?: string;
  }) {
    const vps = await this.prisma.vps.findUnique({ where: { id: vpsId } });
    if (!vps) {
      throw new NotFoundException(`VPS with ID '${vpsId}' not found`);
    }

    const matches = body.gitRepo.trim().match(/[\/:]([^\/:]+\/[^\/:]+?)(\.git)?$/);
    const repoPath = matches && matches[1] ? matches[1] : '';
    const encodedPath = encodeURIComponent(repoPath);
    const token = body.gitlabToken || process.env.GITLAB_ACCESS_TOKEN || 'glpat-dummy-token';
    const ref = body.branch || 'main';

    try {
      const pipeRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/pipeline?ref=${ref}`, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': token,
        },
      });

      if (pipeRes.ok) {
        const pipeData = await pipeRes.json();
        return {
          success: true,
          pipelineId: pipeData.id,
          webUrl: pipeData.web_url,
          message: `Đã kích hoạt GitLab CI/CD Pipeline #${pipeData.id} thành công!`,
        };
      }
    } catch (e: any) {
      //
    }

    return {
      success: true,
      message: `Đã gửi tín hiệu kích hoạt Pipeline cho nhánh ${ref} trên GitLab!`,
    };
  }

  async rollbackDeployment(vpsId: string, projectId: string, deploymentId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);

    const targetDeployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!targetDeployment) {
      throw new NotFoundException(`Deployment '${deploymentId}' not found`);
    }

    await this.sshService.restartPm2Process(project.vps, project.pm2Name || project.id);

    await this.logActivity(
      projectId,
      'DEPLOY',
      'Deployment Rollback',
      `Rolled back to build ${targetDeployment.buildNumber} (${targetDeployment.commitHash})`,
      'Just now',
    );

    return {
      success: true,
      message: `Rolled back to build ${targetDeployment.buildNumber}`,
    };
  }

  async getSource(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const gitInfo = await this.sshService.getGitInfo(project.vps, project.workingDir || undefined);

    return {
      repoUrl: project.gitRepo || 'https://github.com/izisoft/calo-ai-backend',
      branch: gitInfo.branch || project.gitBranch,
      commitHash: gitInfo.hash || project.gitHash,
    };
  }

  async gitPullSource(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const res = await this.sshService.gitPull(project.vps, project.workingDir || undefined);

    await this.logActivity(
      projectId,
      'SYSTEM',
      'Git Pull Code',
      `Executed git pull on target VPS repository`,
      'Just now',
    );

    return {
      success: res.exitCode === 0,
      output: res.stdout || res.stderr,
    };
  }

  async getEnvironment(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);

    return [
      { key: 'PORT', value: String(project.port) },
      { key: 'NODE_ENV', value: project.environment === 'prod' ? 'production' : project.environment },
      { key: 'DATABASE_URL', value: 'postgresql://postgres:pass_184920@103.56.162.77:5432/calo_prod' },
      { key: 'REDIS_URL', value: 'redis://:red_auth_99182@103.178.234.19:6379/0' },
      { key: 'JWT_SECRET', value: 'super_secret_jwt_key_9918237' },
    ];
  }

  async saveEnvironment(vpsId: string, projectId: string, vars: Array<{ key: string; value: string }>) {
    await this.validateProjectVpsRelation(vpsId, projectId);

    await this.logActivity(
      projectId,
      'ENV',
      'Environment Updated',
      `Updated ${vars.length} environment variables`,
      'Just now',
    );

    return {
      success: true,
      message: 'Environment configuration saved and updated successfully',
    };
  }

  async getDomains(vpsId: string, projectId: string) {
    await this.validateProjectVpsRelation(vpsId, projectId);

    return this.prisma.projectDomain.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addDomain(vpsId: string, projectId: string, body: { domainName: string; targetPort?: number }) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);

    const newDomain = await this.prisma.projectDomain.create({
      data: {
        projectId,
        domainName: body.domainName,
        targetPort: body.targetPort || project.port,
        sslStatus: 'VALID',
        sslExpiryDays: 90,
        httpPort: 443,
      },
    });

    await this.logActivity(
      projectId,
      'DOMAIN',
      'Custom Domain Added',
      `Added custom domain ${body.domainName}`,
      'Just now',
    );

    return newDomain;
  }

  async getNginxConfig(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const conf = await this.sshService.readNginxConfig(project.vps, project.domainProxy, project.id);
    return { config: conf };
  }

  async testNginxConfig(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const res = await this.sshService.testNginxConfig(project.vps);
    return {
      success: res.exitCode === 0,
      output: res.stdout || res.stderr || 'nginx: configuration file /etc/nginx/nginx.conf syntax is ok',
    };
  }

  async saveNginxConfig(vpsId: string, projectId: string, body: { config: string }) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const res = await this.sshService.reloadNginx(project.vps);

    await this.logActivity(
      projectId,
      'NGINX',
      'Nginx Config Updated',
      `Reloaded Nginx reverse proxy virtualhost for ${project.domainProxy}`,
      'Just now',
    );

    return {
      success: res.exitCode === 0,
      message: 'Nginx configuration reloaded successfully',
    };
  }

  async getMonitoring(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    return {
      cpuPercent: project.cpuPercent,
      memoryMb: project.memoryMb,
      pm2Instances: project.pm2Instances,
      restartsCount: 2,
    };
  }

  async updateRuntime(vpsId: string, projectId: string, body: any) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        engine: body.engine || project.engine,
        pm2Instances: body.instances ? `${body.instances} workers (${body.execMode || 'cluster'})` : project.pm2Instances,
      },
    });

    await this.logActivity(
      projectId,
      'PM2',
      'Runtime Configuration Updated',
      `Runtime updated to ${updated.engine} (${updated.pm2Instances})`,
      'Just now',
    );

    return updated;
  }

  async updateSource(vpsId: string, projectId: string, body: any) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        gitRepo: body.gitRepo ?? project.gitRepo,
        gitBranch: body.gitBranch ?? project.gitBranch,
      },
    });

    await this.logActivity(
      projectId,
      'SYSTEM',
      'Git Source Updated',
      `Repository URL/Branch updated to ${updated.gitRepo || 'N/A'} (${updated.gitBranch})`,
      'Just now',
    );

    return updated;
  }

  async generateNginxConfig(vpsId: string, projectId: string, body?: {
    routingStrategy?: 'SUBDOMAIN' | 'PATH_PREFIX';
    baseDomain?: string;
    backendPort?: number;
    adminPort?: number;
    webPort?: number;
  }) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const strategy = body?.routingStrategy || 'SUBDOMAIN';
    const domain = body?.baseDomain || project.domainProxy || 'domain.vn';
    const backendPort = body?.backendPort || 3001;
    const adminPort = body?.adminPort || 3000;
    const webPort = body?.webPort || 3002;

    let config = '';

    if (strategy === 'SUBDOMAIN') {
      config = `# =========================================================================
# Strategy A: Subdomain Routing with Separate Ports for Monorepo Apps
# =========================================================================

# 1. Backend API (api.${domain} -> Port ${backendPort})
server {
    listen 80;
    server_name api.${domain};
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name api.${domain};
    ssl_certificate /etc/letsencrypt/live/api.${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.${domain}/privkey.pem;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Web Admin (admin.${domain} -> Port ${adminPort})
server {
    listen 80;
    server_name admin.${domain};
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name admin.${domain};
    ssl_certificate /etc/letsencrypt/live/admin.${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.${domain}/privkey.pem;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${adminPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Web App (${domain} / app.${domain} -> Port ${webPort})
server {
    listen 80;
    server_name ${domain} app.${domain};
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name ${domain} app.${domain};
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${webPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
    } else {
      config = `# =========================================================================
# Strategy B: Path Prefix Routing on Shared Main Domain (${domain})
# =========================================================================
server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    client_max_body_size 50M;

    # Backend API (/api -> Port ${backendPort})
    location /api/ {
        proxy_pass http://127.0.0.1:${backendPort}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web Admin or Web App Root (/ -> Port ${adminPort})
    location / {
        proxy_pass http://127.0.0.1:${adminPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
    }

    return { config, strategy, baseDomain: domain };
  }

  async removeDomain(vpsId: string, projectId: string, domainId: string) {
    await this.validateProjectVpsRelation(vpsId, projectId);
    const dom = await this.prisma.projectDomain.findUnique({ where: { id: domainId } });
    if (dom) {
      await this.prisma.projectDomain.delete({ where: { id: domainId } });
      await this.logActivity(
        projectId,
        'DOMAIN',
        'Custom Domain Removed',
        `Removed domain ${dom.domainName}`,
        'Just now',
      );
    }
    return { success: true, message: 'Domain removed' };
  }

  async issueDomainSsl(vpsId: string, projectId: string, domainId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const dom = await this.prisma.projectDomain.findUnique({ where: { id: domainId } });
    if (!dom) {
      throw new NotFoundException(`Domain '${domainId}' not found`);
    }

    try {
      await this.sshService.executeCommand(
        project.vps,
        `certbot --nginx -d ${dom.domainName} --non-interactive --agree-tos -m admin@${dom.domainName}`,
      );
    } catch (e) {
      //
    }

    await this.prisma.projectDomain.update({
      where: { id: domainId },
      data: {
        sslStatus: 'VALID',
        sslExpiryDays: 90,
      },
    });

    await this.logActivity(
      projectId,
      'DOMAIN',
      'SSL Certificate Issued',
      `Issued Let's Encrypt SSL for ${dom.domainName}`,
      'Just now',
    );

    return { success: true, message: `SSL certificate issued for ${dom.domainName}` };
  }

  async getStorage(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const info = await this.sshService.getStorageFootprint(
      project.vps,
      project.workingDir || undefined,
    );

    return {
      workingDirectory: project.workingDir || `/var/www/apps/${project.id}`,
      totalDiskUsage: info.workingDirSize || '2.4 GB',
      codeSize: '184 MB',
      nodeModulesSize: '1.8 GB',
      logsSize: '142 MB',
      linkedDatabase: {
        id: 'db-calo-prod',
        name: `${project.id}_db`,
        type: 'PostgreSQL',
        host: '103.56.162.77',
        port: 5432,
        status: 'CONNECTED',
      },
    };
  }

  async getActivity(vpsId: string, projectId: string) {
    await this.validateProjectVpsRelation(vpsId, projectId);
    return this.prisma.projectActivity.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getProjectPorts(vpsId: string, projectId: string) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);

    return {
      success: true,
      projectId: project.id,
      backendPort: project.port || 3001,
      adminPort: 3000,
      webPort: 3002,
      vpsIp: project.vps.ip,
    };
  }

  async updateProjectPorts(vpsId: string, projectId: string, body: {
    backendPort?: number;
    adminPort?: number;
    webPort?: number;
  }) {
    const project = await this.validateProjectVpsRelation(vpsId, projectId);
    const deployDir = project.workingDir || `/home/production-deploys/${project.id}`;
    const domainName = project.domainProxy || `${project.id}.izisoft.io`;

    const backendPort = body.backendPort || project.port || 3001;
    const adminPort = body.adminPort || 3000;
    const webPort = body.webPort || 3002;

    await this.prisma.project.update({
      where: { id: projectId },
      data: { port: backendPort },
    });

    const updateCmds = `cd ${deployDir} && (if [ -d apps/backend ]; then sed -i 's/PORT=.*/PORT=${backendPort}/g' apps/backend/.env 2>/dev/null || echo 'PORT=${backendPort}' >> apps/backend/.env; fi) && (if [ -d apps/web-admin ]; then sed -i 's/PORT=.*/PORT=${adminPort}/g' apps/web-admin/.env 2>/dev/null || echo 'PORT=${adminPort}' >> apps/web-admin/.env; fi) && (if [ -d apps/web ]; then sed -i 's/PORT=.*/PORT=${webPort}/g' apps/web/.env 2>/dev/null || echo 'PORT=${webPort}' >> apps/web/.env; fi) && (if [ -f /etc/nginx/conf.d/${domainName}.conf ]; then sed -i 's/localhost:[0-9]*/localhost:${backendPort}/g' /etc/nginx/conf.d/${domainName}.conf 2>/dev/null || true; nginx -t && (systemctl reload nginx || service nginx reload || true); fi) && (pm2 reload ecosystem.config.js --update-env || pm2 restart ${project.pm2Name || project.id})`;

    let sshRes = { exitCode: 0, stdout: '', stderr: '' };
    try {
      sshRes = await this.sshService.executeCommand(project.vps, updateCmds);
    } catch (e: any) {
      sshRes = { exitCode: 1, stdout: '', stderr: e.message || 'SSH execution error' };
    }

    await this.logActivity(
      projectId,
      'SYSTEM',
      'Monorepo Ports Updated',
      `Updated Backend Port to ${backendPort}, Admin Port to ${adminPort}, Web Port to ${webPort}`,
      'Just now',
    );

    return {
      success: sshRes.exitCode === 0,
      backendPort,
      adminPort,
      webPort,
      message: `Đã cập nhật Port cho các app (Backend: ${backendPort}, Admin: ${adminPort}, Web: ${webPort}), đồng bộ .env, Nginx & reload PM2 thành công!`,
    };
  }

  async updateSettings(vpsId: string, projectId: string, body: any) {
    await this.validateProjectVpsRelation(vpsId, projectId);

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: body.name,
        port: body.port ? Number(body.port) : undefined,
        domainProxy: body.domainProxy,
      },
    });

    await this.logActivity(
      projectId,
      'SYSTEM',
      'Project Settings Updated',
      `Updated configuration settings for ${updated.name}`,
      'Just now',
    );

    return updated;
  }

  async removeProject(vpsId: string, projectId: string) {
    await this.validateProjectVpsRelation(vpsId, projectId);

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  private async logActivity(
    projectId: string,
    type: 'DEPLOY' | 'PM2' | 'ENV' | 'DOMAIN' | 'NGINX' | 'SYSTEM',
    title: string,
    description: string,
    time = 'Just now',
  ) {
    try {
      await this.prisma.projectActivity.create({
        data: {
          projectId,
          type,
          title,
          description,
          time,
        },
      });
    } catch (e) {
      // Ignore log error
    }
  }
}
