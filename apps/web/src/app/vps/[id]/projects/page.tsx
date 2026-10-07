'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import {
  fetchProjects,
  createProjectApi,
  syncPm2ProjectsApi,
  stopProjectRuntime,
  restartProjectRuntime,
  removeProjectScope,
  triggerProjectDeployment,
  inspectProjectRepoApi,
  syncGitlabVariablesApi,
  triggerGitlabPipelineApi,
  generateProjectNginxConfigApi,
  updateProjectPortsApi,
  checkPortsAvailabilityApi,
} from '@/modules/projects/api';
import { ProjectItem } from '@/modules/projects/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Folder,
  ArrowRight,
  Plus,
  Loader2,
  RotateCw,
  Search,
  Square,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Rocket,
  GitBranch,
  Copy,
  Terminal,
  Sparkles,
  Link as LinkIcon,
  Globe,
  Layers,
  CheckSquare,
  Square as SquareIcon,
  Key,
  Upload,
  FileCode,
  Lock,
  Play,
  Wand2,
  Check,
  ShieldCheck,
  ExternalLink,
  Sliders,
  Network,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export interface SubAppConfig {
  id: string;
  name: string;
  path: string;
  filter: string;
  port: number;
  enabled: boolean;
  envText: string;
  envMode: 'PASTE' | 'FILE';
}

const DEFAULT_SUB_APPS: SubAppConfig[] = [
  {
    id: 'backend',
    name: 'cloudpulse-backend',
    path: 'apps/backend',
    filter: '@calo_ai/backend',
    port: 22090,
    enabled: true,
    envText: 'PORT=22090\nNODE_ENV=production\nDATABASE_URL=postgresql://postgres:pass_184920@103.56.162.77:5432/calo_prod\nJWT_SECRET=super_secret_jwt_key_9918237',
    envMode: 'PASTE',
  },
  {
    id: 'admin',
    name: 'cloudpulse-web-admin',
    path: 'apps/admin',
    filter: '@calo_ai/admin',
    port: 32090,
    enabled: true,
    envText: 'PORT=32090\nNODE_ENV=production\nNEXT_PUBLIC_API_URL=http://localhost:22090',
    envMode: 'PASTE',
  },
  {
    id: 'web',
    name: 'cloudpulse-web',
    path: 'apps/web',
    filter: '@calo_ai/web',
    port: 42090,
    enabled: true,
    envText: 'PORT=42090\nNODE_ENV=production\nNEXT_PUBLIC_API_URL=http://localhost:22090',
    envMode: 'PASTE',
  },
];

function unwrapParams<T>(params: Promise<T> | T): T {
  if (params && typeof (params as any).then === 'function') {
    return use(params as Promise<T>);
  }
  return params as T;
}

export default function VpsProjectsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = unwrapParams(params);
  const rawId = resolvedParams?.id || '';
  const id = rawId ? decodeURIComponent(rawId) : '';
  const router = useRouter();

  const { data: cluster, isLoading } = useVpsDetail(id);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal View Mode ('WIZARD' vs 'ADVANCED')
  const [wizardMode, setWizardMode] = useState<'WIZARD' | 'ADVANCED'>('WIZARD');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [wizardCompleted, setWizardCompleted] = useState<boolean>(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Expanded .env Sub-Modal State
  const [activeEnvAppId, setActiveEnvAppId] = useState<string | null>(null);
  const [activeEnvAppName, setActiveEnvAppName] = useState<string>('');
  const [expandedEnvText, setExpandedEnvText] = useState<string>('');

  // Expanded Nginx Sub-Modal State
  const [isNginxModalOpen, setIsNginxModalOpen] = useState<boolean>(false);
  const [customNginxConfig, setCustomNginxConfig] = useState<string>('');

  // Advanced Tab State
  const [deployTab, setDeployTab] = useState<'INITIAL' | 'RE_DEPLOY' | 'GITLAB_CI'>('INITIAL');

  // Form State & Monorepo Sub-Apps Ports
  const [gitRepo, setGitRepo] = useState('');
  const [name, setName] = useState('');
  const [engine, setEngine] = useState('NestJS / Node.js 20');
  const [environment, setEnvironment] = useState('prod');
  const [domainProxy, setDomainProxy] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [availableBranches, setAvailableBranches] = useState<string[]>(['main', 'dev', 'master', 'staging', 'production']);
  const [workingDir, setWorkingDir] = useState('');
  const [buildCmd, setBuildCmd] = useState('pnpm install && pnpm build');

  // Dynamic Monorepo Sub-Apps State (Auto-Detected from Repo)
  const [subApps, setSubApps] = useState<SubAppConfig[]>(DEFAULT_SUB_APPS);
  const [routingStrategy, setRoutingStrategy] = useState<'SUBDOMAIN' | 'PATH_PREFIX'>('SUBDOMAIN');

  // GitLab CI/CD Variables State (Pre-filled from current VPS)
  const [gitlabToken, setGitlabToken] = useState('');
  const [ciServerIp, setCiServerIp] = useState('36.50.176.26');
  const [ciDeployDir, setCiDeployDir] = useState('/home/production-deploys/p117qtship');
  const [ciServerUser, setCiServerUser] = useState('root');
  const [ciSshPrivateKey, setCiSshPrivateKey] = useState('-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END OPENSSH PRIVATE KEY-----');

  const [syncingVars, setSyncingVars] = useState(false);
  const [triggeringPipeline, setTriggeringPipeline] = useState(false);

  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  // Port Conflict Checking State
  const [conflictPorts, setConflictPorts] = useState<Record<number, string>>({});
  const [checkingPorts, setCheckingPorts] = useState<boolean>(false);

  const checkPortConflicts = useCallback(
    async (appsToCheck = subApps) => {
      const enabledList = appsToCheck.filter((a) => a.enabled);
      const ports = enabledList.map((a) => Number(a.port)).filter((p) => p && !isNaN(p));

      const newConflicts: Record<number, string> = {};

      // 1. Local duplicate check
      const portCount: Record<number, number> = {};
      ports.forEach((p) => {
        portCount[p] = (portCount[p] || 0) + 1;
      });

      ports.forEach((p) => {
        if (portCount[p] > 1) {
          newConflicts[p] = 'Trùng cổng giữa các Sub-App trong cùng dự án!';
        }
      });

      if (ports.length === 0) {
        setConflictPorts(newConflicts);
        return newConflicts;
      }

      // 2. Remote VPS & DB check
      try {
        setCheckingPorts(true);
        const res = await checkPortsAvailabilityApi(id, ports, createdProjectId || undefined);
        if (res?.hasConflicts && Array.isArray(res.usedPorts)) {
          res.usedPorts.forEach((item: any) => {
            newConflicts[item.port] = item.reason || `Cổng ${item.port} đã tồn tại/đang chạy trên VPS!`;
          });
        }
      } catch (e) {
        //
      } finally {
        setCheckingPorts(false);
      }

      setConflictPorts(newConflicts);
      return newConflicts;
    },
    [id, subApps, createdProjectId],
  );

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects(id);
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (e) {
      //
    }
  }, [id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (cluster?.ip) setCiServerIp(cluster.ip);
    if (cluster?.username) setCiServerUser(cluster.username);
    if (workingDir) setCiDeployDir(workingDir);
  }, [cluster, workingDir]);

  const [deployLogs, setDeployLogs] = useState<string>('');
  const [deployError, setDeployError] = useState<string | null>(null);

  const resetModalState = () => {
    setWizardStep(1);
    setProgressStep(0);
    setWizardCompleted(false);
    setDeployLogs('');
    setDeployError(null);
    setCreatedProjectId(null);
    setAutoDetected(false);
    setCustomNginxConfig('');
  };

  const enabledApps = subApps.filter((a) => a.enabled);
  const primaryPort = enabledApps.find((a) => a.id.includes('backend'))?.port || enabledApps[0]?.port || 4117;

  const getDefaultNginxConfig = useCallback(() => {
    const backendApp = enabledApps.find((a) => a.id.includes('backend'));
    const adminApp = enabledApps.find((a) => a.id.includes('admin'));
    const webApp = enabledApps.find((a) => a.id.includes('web'));

    const backendPortNum = backendApp?.port || primaryPort || 22090;
    const adminPortNum = adminApp?.port || 32090;
    const webPortNum = webApp?.port || 42090;
    const domainName = domainProxy || `${name || 'cloudpulse'}.izisoft.io`;

    return `server {
  listen 80;
  listen [::]:80;

  server_name ${domainName};

  # 1. Định tuyến cho BACKEND (Port ${backendPortNum})
  location /api/ {
    proxy_pass http://localhost:${backendPortNum};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /docs {
    proxy_pass http://localhost:${backendPortNum};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }

  location /docs-json {
    proxy_pass http://localhost:${backendPortNum};
  }

  location /uploads/ {
    proxy_pass http://localhost:${backendPortNum};
  }

  location /images/ {
    proxy_pass http://localhost:${backendPortNum};
  }

  # 2. Định tuyến cho WEB ADMIN (Port ${adminPortNum})
  location /admin/ {
    proxy_pass http://localhost:${adminPortNum}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location = /admin {
    return 301 $scheme://$host/admin/;
  }

  # 3. Định tuyến cho WEB APP (Port ${webPortNum})
  location / {
    proxy_pass http://localhost:${webPortNum};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}`;
  }, [domainProxy, name, primaryPort, enabledApps]);

function syncSubAppEnvText(
  envText: string,
  port: number,
  nodeEnv: string,
  apiUrl?: string,
): string {
  let lines = envText ? envText.split('\n') : [];
  let hasPort = false;
  let hasNodeEnv = false;
  let hasApiUrl = false;

  lines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('PORT=')) {
      hasPort = true;
      return `PORT=${port}`;
    }
    if (trimmed.startsWith('NODE_ENV=')) {
      hasNodeEnv = true;
      return `NODE_ENV=${nodeEnv}`;
    }
    if (trimmed.startsWith('NEXT_PUBLIC_API_URL=')) {
      hasApiUrl = true;
      return apiUrl ? `NEXT_PUBLIC_API_URL=${apiUrl}` : line;
    }
    return line;
  });

  if (!hasPort) {
    lines.unshift(`PORT=${port}`);
  }
  if (!hasNodeEnv) {
    const portIdx = lines.findIndex((l) => l.startsWith('PORT='));
    lines.splice(portIdx !== -1 ? portIdx + 1 : 1, 0, `NODE_ENV=${nodeEnv}`);
  }
  if (apiUrl && !hasApiUrl) {
    lines.push(`NEXT_PUBLIC_API_URL=${apiUrl}`);
  }

  return lines.join('\n');
}

  const toggleSubApp = (appId: string) => {
    setSubApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, enabled: !app.enabled } : app)),
    );
  };

  const updateSubAppPort = (appId: string, portNum: number) => {
    setSubApps((prev) => {
      const isBackend = appId.includes('backend');
      const backendPort = isBackend ? portNum : prev.find((a) => a.id.includes('backend'))?.port || 22090;
      const currentEnv = environment === 'prod' ? 'production' : environment || 'production';

      return prev.map((app) => {
        if (app.id === appId) {
          const apiUrl = !isBackend ? `http://localhost:${backendPort}` : undefined;
          const newEnv = syncSubAppEnvText(app.envText, portNum, currentEnv, apiUrl);
          return { ...app, port: portNum, envText: newEnv };
        } else if (isBackend && !app.id.includes('backend')) {
          const apiUrl = `http://localhost:${portNum}`;
          const newEnv = syncSubAppEnvText(app.envText, app.port, currentEnv, apiUrl);
          return { ...app, envText: newEnv };
        }
        return app;
      });
    });
  };

  const updateSubAppEnv = (appId: string, text: string) => {
    setSubApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, envText: text } : app)),
    );
  };

  const updateSubAppEnvMode = (appId: string, mode: 'PASTE' | 'FILE') => {
    setSubApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, envMode: mode } : app)),
    );
  };

  const handleOpenExpandedEnvModal = (appId: string, appName: string, currentEnvText: string) => {
    setActiveEnvAppId(appId);
    setActiveEnvAppName(appName);
    setExpandedEnvText(currentEnvText);
  };

  const handleSaveExpandedEnvModal = () => {
    if (activeEnvAppId) {
      updateSubAppEnv(activeEnvAppId, expandedEnvText);
      toast.success(`Đã cập nhật .env cho ${activeEnvAppName}!`);
    }
    setActiveEnvAppId(null);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    appId: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        updateSubAppEnv(appId, content);
        toast.success(`Đã tải file .env cho ${appId} (${file.name})!`);
      }
    };
    reader.readAsText(file);
  };

  const handleInspectRepo = async (urlToInspect?: string, targetBranch?: string) => {
    const url = urlToInspect || gitRepo;
    const branchToUse = targetBranch || gitBranch || 'main';

    if (!url || !url.trim()) {
      toast.error('Vui lòng nhập Link Git Repository');
      return;
    }

    const matches = url.trim().match(/[\/:]([^\/:]+?)(\.git)?$/);
    const slug = matches && matches[1] ? matches[1] : '';
    if (slug) {
      if (!name) setName(slug);
      if (!workingDir) {
        setWorkingDir(`/home/production-deploys/${slug}`);
        setCiDeployDir(`/home/production-deploys/${slug}`);
      }
      if (!domainProxy) setDomainProxy(`${slug}.izisoft.io`);
      setAutoDetected(true);
    }

    try {
      setInspecting(true);
      const res = await inspectProjectRepoApi(id, url, branchToUse);
      if (res?.success) {
        if (res.name && !name) setName(res.name);
        if (res.deployDir && !workingDir) {
          setWorkingDir(res.deployDir);
          setCiDeployDir(res.deployDir);
        }
        if (res.domainProxy && !domainProxy) setDomainProxy(res.domainProxy);
        if (res.gitBranch) setGitBranch(res.gitBranch);

        if (Array.isArray(res.branches) && res.branches.length > 0) {
          setAvailableBranches(res.branches);
        }

        if (Array.isArray(res.detectedApps) && res.detectedApps.length > 0) {
          setSubApps(
            res.detectedApps.map((app: any) => ({
              id: app.id,
              name: app.name,
              path: app.path,
              filter: app.filter,
              port: app.defaultPort || (app.id.includes('backend') ? 22090 : app.id.includes('admin') ? 32090 : 42090),
              enabled: true,
              envText: app.envExample || `PORT=${app.defaultPort || (app.id.includes('backend') ? 22090 : 32090)}\nNODE_ENV=production`,
              envMode: 'PASTE',
            })),
          );
        }

        setAutoDetected(true);
        toast.success(
          `✨ Đã phân tích thành công Repo (${branchToUse}): Tìm thấy ${res.detectedApps?.length || 0} Sub-Apps & đúng số Ports!`,
        );
      }
    } catch (e: any) {
      setAutoDetected(false);
      const errMessage = e?.response?.data?.message || e?.message || 'Không thể xác thực Git Repository hoặc không tìm thấy file ecosystem.config.js!';
      toast.error(errMessage);
    } finally {
      setInspecting(false);
    }
  };

  const handleGitRepoChange = (val: string) => {
    setGitRepo(val);
    const matches = val.trim().match(/[\/:]([^\/:]+?)(\.git)?$/);
    const slug = matches && matches[1] ? matches[1] : '';
    if (slug) {
      if (!name) setName(slug);
      if (!workingDir) {
        setWorkingDir(`/home/production-deploys/${slug}`);
        setCiDeployDir(`/home/production-deploys/${slug}`);
      }
      if (!domainProxy) setDomainProxy(`${slug}.izisoft.io`);
    }
  };

  const handleGoToStep2 = async () => {
    if (!gitRepo.trim()) {
      toast.error('Vui lòng nhập Link Git Repository');
      return;
    }
    if (!gitBranch.trim()) {
      toast.error('Vui lòng chọn hoặc nhập Nhánh Git (Branch)');
      return;
    }
    if (!autoDetected) {
      await handleInspectRepo(gitRepo, gitBranch);
    }
    setWizardStep(2);
  };

  const handleStartWizardDeploy = async () => {
    if (!gitRepo.trim()) {
      toast.error('Vui lòng dán Link Git Repository');
      return;
    }

    const enabledList = subApps.filter((a) => a.enabled);
    if (enabledList.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 Sub-App cần deploy');
      return;
    }

    // Validate port conflicts on VPS & DB
    const conflicts = await checkPortConflicts(enabledList);
    if (Object.keys(conflicts).length > 0) {
      const conflictMsg = Object.entries(conflicts)
        .map(([p, reason]) => `• Cổng ${p}: ${reason}`)
        .join('\n');
      toast.error(`❌ Cổng đã tồn tại/đang sử dụng trên VPS:\n${conflictMsg}`);
      return;
    }

    const backendApp = enabledList.find((a) => a.id.includes('backend')) || enabledList[0];
    const backendPort = backendApp?.port || 22090;

    const appEnvsObj: Record<string, string> = {};
    enabledList.forEach((a) => {
      appEnvsObj[a.id] = a.envText;
    });

    try {
      setWizardStep(3);
      setWizardCompleted(false);
      setDeployError(null);
      setProgressStep(1); // 1. Registering Project DB

      const newProj = await createProjectApi(id, {
        name: name || 'p117qtship',
        engine,
        environment,
        port: backendPort,
        domainProxy: domainProxy || `${name || 'p117qtship'}.izisoft.io`,
        gitRepo,
        gitBranch,
        workingDir: workingDir || `/home/production-deploys/${name || 'p117qtship'}`,
      });

      setCreatedProjectId(newProj?.id || name);

      // 2. Auto-generate Nginx Proxy (/etc/nginx/conf.d/<domain>.conf)
      setProgressStep(2);
      try {
        await generateProjectNginxConfigApi(id, newProj?.id || name, {
          routingStrategy,
          baseDomain: domainProxy || `${name || 'p117qtship'}.izisoft.io`,
          backendPort,
        });
      } catch (err) {
        //
      }

      // 3. Trigger SSH Deployment Pipeline on VPS
      setProgressStep(3);
      const targetProjId = newProj?.id || name;
      const deployRes = await triggerProjectDeployment(id, targetProjId, {
        deployMode: 'INITIAL',
        author: 'Zero-Tech 1-Click Pipeline',
        deployDir: workingDir || `/home/production-deploys/${targetProjId}`,
        gitBranch,
        port: backendPort,
        domainName: domainProxy || `${name || 'p117qtship'}.izisoft.io`,
        buildCmd: buildCmd || 'pnpm install && pnpm build',
        envText: backendApp?.envText || `PORT=${backendPort}\nNODE_ENV=production`,
        appEnvs: appEnvsObj as any,
      });

      // Synchronize Monorepo Ports to DB & Configs
      try {
        const adminApp = enabledList.find((a) => a.id.includes('admin'));
        const webApp = enabledList.find((a) => a.id.includes('web') && !a.id.includes('admin'));

        await updateProjectPortsApi(id, targetProjId, {
          backendPort,
          adminPort: adminApp?.port || 32090,
          webPort: webApp?.port || 42090,
        });
      } catch (err) {
        //
      }

      // 4. Poll SSH Deployment status in real-time
      let finalDeployStatus = deployRes?.status || 'RUNNING';
      let finalLogs = deployRes?.logs || 'Đang khởi chạy kịch bản SSH trên VPS...';
      setDeployLogs(finalLogs);

      const startTime = Date.now();
      while (finalDeployStatus === 'RUNNING' && Date.now() - startTime < 300000) {
        await new Promise((r) => setTimeout(r, 2500));
        try {
          const deps = await fetchProjectDeployments(id, targetProjId);
          if (Array.isArray(deps) && deps.length > 0) {
            const latestDep = deps[0];
            finalDeployStatus = latestDep.status || 'RUNNING';
            finalLogs = latestDep.logs || finalLogs;
            setDeployLogs(finalLogs);

            if (finalLogs.includes('=== STEP 3:')) setProgressStep(3);
            if (finalLogs.includes('=== STEP 4:')) setProgressStep(3);
            if (finalLogs.includes('=== STEP 6:')) setProgressStep(4);
            if (finalLogs.includes('=== STEP 7:')) setProgressStep(5);
          }
        } catch (pollErr) {
          //
        }
      }

      if (finalDeployStatus === 'FAILED' || finalLogs.includes('MODULE_NOT_FOUND')) {
        setProgressStep(5);
        setWizardCompleted(false);
        setDeployError(finalLogs || 'Lỗi thực thi lệnh SSH trên VPS');
        toast.error(`❌ Deploy thất bại! Vui lòng kiểm tra nhật ký lỗi bên dưới.`);
      } else {
        setProgressStep(5);
        setWizardCompleted(true);
        toast.success('🎉 DỰ ÁN ĐÃ DEPLOY THÀNH CÔNG HOÀN TÀN!');
      }
      await loadProjects();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Có lỗi xảy ra trong quá trình deploy tự động');
    }
  };

  const handleSyncGitlabVariables = async () => {
    if (!gitRepo.trim()) {
      toast.error('Vui lòng nhập Link Git Repository');
      return;
    }
    try {
      setSyncingVars(true);
      const res = await syncGitlabVariablesApi(id, {
        gitRepo,
        gitlabToken,
        variables: [
          { key: 'SERVER_IP', value: ciServerIp || cluster?.ip || '36.50.176.26', masked: false },
          { key: 'DEPLOY_DIR', value: ciDeployDir || workingDir || '/home/production-deploys/p117qtship', masked: false },
          { key: 'SERVER_USER', value: ciServerUser || cluster?.username || 'root', masked: false },
          { key: 'SSH_PRIVATE_KEY', value: ciSshPrivateKey, masked: false },
        ],
      });
      toast.success(res?.message || 'Đã đồng bộ 4 biến CI/CD Variables lên GitLab repository!');
    } catch (e: any) {
      toast.error('Đồng bộ biến CI/CD thất bại. Vui lòng kiểm tra GitLab Access Token');
    } finally {
      setSyncingVars(false);
    }
  };

  const handleTriggerPipeline = async () => {
    if (!gitRepo.trim()) {
      toast.error('Vui lòng nhập Link Git Repository');
      return;
    }
    try {
      setTriggeringPipeline(true);
      const res = await triggerGitlabPipelineApi(id, {
        gitRepo,
        gitlabToken,
        branch: gitBranch || 'main',
      });
      toast.success(res?.message || 'Đã kích hoạt chạy GitLab CI/CD Pipeline!');
    } catch (e) {
      toast.error('Kích hoạt pipeline thất bại');
    } finally {
      setTriggeringPipeline(false);
    }
  };

  const handleSyncPm2 = async () => {
    try {
      setSyncing(true);
      const res = await syncPm2ProjectsApi(id);
      toast.success(res?.message || 'Đồng bộ tiến trình PM2 thành công!');
      await loadProjects();
    } catch (e: any) {
      toast.error('Lỗi đồng bộ tiến trình PM2');
    } finally {
      setSyncing(false);
    }
  };

  const handleStop = async (projId: string) => {
    try {
      setActionLoading(`stop-${projId}`);
      await stopProjectRuntime(id, projId);
      toast.warning(`Đã gửi lệnh ngắt (Stop) tiến trình PM2 của ${projId}`);
      await loadProjects();
    } catch (e) {
      toast.error('Lỗi khi dừng tiến trình');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReload = async (projId: string) => {
    try {
      setActionLoading(`reload-${projId}`);
      await restartProjectRuntime(id, projId);
      toast.success(`Đã khởi động lại (Reload) tiến trình PM2 của ${projId}`);
      await loadProjects();
    } catch (e) {
      toast.error('Lỗi khi khởi động lại tiến trình');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (projId: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tiến trình PM2 '${projId}' và hủy dự án này khỏi DB?`)) return;
    try {
      setActionLoading(`delete-${projId}`);
      await removeProjectScope(id, projId);
      toast.success(`Đã xóa tiến trình PM2 '${projId}' khỏi VPS và Database`);
      await loadProjects();
    } catch (e) {
      toast.error('Lỗi khi xóa dự án');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập Tên Dự Án hoặc dán Link Git Repo');
      return;
    }

    const enabledList = subApps.filter((a) => a.enabled);
    if (enabledList.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 Sub-App cần deploy');
      return;
    }

    const backendApp = enabledList.find((a) => a.id.includes('backend')) || enabledList[0];
    const backendPort = backendApp?.port || 4117;

    const appEnvsObj: Record<string, string> = {};
    enabledList.forEach((a) => {
      appEnvsObj[a.id] = a.envText;
    });

    try {
      setCreating(true);
      const newProj = await createProjectApi(id, {
        name,
        engine,
        environment,
        port: backendPort,
        domainProxy: domainProxy || `${name}.izisoft.io`,
        gitRepo,
        gitBranch,
        workingDir: workingDir || `/home/production-deploys/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      });

      if (deployTab === 'INITIAL' && newProj?.id) {
        toast.info(`Đang khởi tạo, clone mã nguồn & cấu hình file .env trên VPS...`);
        await triggerProjectDeployment(id, newProj.id, {
          deployMode: 'INITIAL',
          author: 'Admin User',
          deployDir: workingDir || `/home/production-deploys/${newProj.id}`,
          gitBranch,
          port: backendPort,
          domainName: domainProxy || `${name}.izisoft.io`,
          buildCmd: buildCmd || 'pnpm install && pnpm build',
          envText: backendApp?.envText || `PORT=${backendPort}\nNODE_ENV=production`,
          appEnvs: appEnvsObj as any,
        });
      } else if (deployTab === 'RE_DEPLOY' && newProj?.id) {
        toast.info('Đang pull code & reload dự án...');
        await triggerProjectDeployment(id, newProj.id, {
          deployMode: 'RE_DEPLOY',
          author: 'Admin User',
          gitBranch,
          port: backendPort,
          domainName: domainProxy || `${name}.izisoft.io`,
          buildCmd: buildCmd || 'pnpm install && pnpm build',
          appEnvs: appEnvsObj as any,
        });
      }

      toast.success(`Dự án "${name}" đã được xác nhận & kích hoạt trên VPS!`);
      setIsModalOpen(false);
      resetModalState();
      await loadProjects();
      if (newProj?.id) {
        router.push(`/vps/${id}/projects/${newProj.id}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi tạo dự án');
    } finally {
      setCreating(false);
    }
  };

  const sampleGitlabCi = `stages:
  - deploy

variables:
  DEPLOY_DIR: "${workingDir || `/home/production-deploys/${name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'p117qtship'}`}"
  SERVER_IP: "${ciServerIp || cluster?.ip || '36.50.176.26'}"
  SERVER_USER: "${ciServerUser || cluster?.username || 'root'}"

deploy_job:
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
    - ssh -p \${SSH_PORT:-22} $SERVER_USER@$SERVER_IP "if [ ! -d $DEPLOY_DIR ]; then echo 'Thư mục chưa tồn tại, đang clone mã nguồn...' && mkdir -p /home/production-deploys && cd /home/production-deploys && git clone ${gitRepo || 'git@gitlab.com:izisoftware2020/p117qtship.git'}; fi && cd $DEPLOY_DIR && git pull origin ${gitBranch || 'main'} && ${buildCmd || 'pnpm install && pnpm build'} && (pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js --update-env)"
  rules:
    - if: '$CI_COMMIT_BRANCH == "${gitBranch || 'main'}"'
`;

  const handleCopyGitlabCi = () => {
    navigator.clipboard.writeText(sampleGitlabCi);
    toast.success('Đã sao chép file .gitlab-ci.yml!');
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.domainProxy && p.domainProxy.toLowerCase().includes(term))
    );
  });

  if (isLoading || !cluster) {
    return (
      <DashboardShell>
        <div className="space-y-6 max-w-[1440px] mx-auto">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ClusterNavHeader cluster={cluster} />

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          {/* Header Bar & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Folder className="w-5 h-5 text-blue-600" />
                <span>Hosted Projects & PM2 Services on {cluster.name} ({filteredProjects.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Tự động đồng bộ tiến trình PM2, theo dõi trạng thái, khởi động/dừng/xóa tiến trình và quản lý domain proxy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={syncing}
                onClick={handleSyncPm2}
                className="h-8 text-xs gap-1.5"
              >
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5 text-blue-600" />}
                <span>Đồng bộ PM2</span>
              </Button>
              <Button size="sm" onClick={() => { resetModalState(); setIsModalOpen(true); }} className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy New Project</span>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên Project hoặc Domain proxy..."
              className="h-9 pl-9 pr-3 text-xs"
            />
          </div>

          {/* Table of Hosted Projects */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-4">Project Name & Engine</th>
                  <th className="py-3 px-4">Domain Proxy / Port</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Đồng bộ PM2</th>
                  <th className="py-3 px-4">PM2 Mode</th>
                  <th className="py-3 px-4 text-right">Thao tác PM2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                      Không tìm thấy dự án nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((proj) => {
                    const isNew = proj.syncStatus === 'NEW';
                    const isRemoved = proj.syncStatus === 'REMOVED';

                    return (
                      <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/vps/${cluster.id}/projects/${proj.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {proj.name}
                          </Link>
                          <div className="text-[11px] text-slate-500">{proj.engine}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-semibold text-slate-900">{proj.domainProxy}</div>
                          <div className="text-[11px] text-slate-500">Port {proj.port}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1 w-fit ${
                              proj.status === 'running'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                proj.status === 'running' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span className="capitalize">{proj.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Mới</span>
                            </span>
                          )}
                          {isRemoved && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px] flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Đã xóa</span>
                            </span>
                          )}
                          {!isNew && !isRemoved && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[11px] flex items-center gap-1 w-fit">
                              <RotateCw className="w-3 h-3 text-blue-600" />
                              <span>Đã đồng bộ</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{proj.pm2Instances}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === `reload-${proj.id}`}
                              onClick={() => handleReload(proj.id)}
                              title="Khởi động lại PM2 (Reload)"
                              className="h-7 px-2 text-xs gap-1 text-blue-600 hover:bg-blue-50"
                            >
                              {actionLoading === `reload-${proj.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span>Reload</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === `stop-${proj.id}`}
                              onClick={() => handleStop(proj.id)}
                              title="Tạm dừng PM2 (Stop)"
                              className="h-7 px-2 text-xs gap-1 text-slate-700 hover:bg-slate-100"
                            >
                              {actionLoading === `stop-${proj.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-amber-600" />
                              )}
                              <span>Stop</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === `delete-${proj.id}`}
                              onClick={() => handleDelete(proj.id)}
                              title="Xóa PM2 và gỡ khỏi DB (Delete)"
                              className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              {actionLoading === `delete-${proj.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Delete</span>
                            </Button>

                            <Link href={`/vps/${cluster.id}/projects/${proj.id}`}>
                              <Button size="sm" className="h-7 px-2.5 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deploy Project Dialog with Dynamic Selective Sub-Apps Configurator */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6 border-b border-slate-100 pb-3">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Wand2 className="w-5 h-5 text-blue-600" />
                <span>Trình Config & Deploy Tự Động ({cluster.name})</span>
              </DialogTitle>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setWizardMode('WIZARD')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    wizardMode === 'WIZARD' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>5-Step Pipeline Wizard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWizardMode('ADVANCED')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    wizardMode === 'ADVANCED' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>GitLab CI & CI/CD Vars</span>
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* STRUCTURED 5-STEP PIPELINE WIZARD */}
          {wizardMode === 'WIZARD' && (
            <div className="space-y-6 py-2">
              {/* Step Progress Bar Header */}
              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-4">
                <div className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all ${wizardStep === 1 ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs' : wizardStep > 1 ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-400 bg-slate-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${wizardStep === 1 ? 'bg-blue-600 text-white' : wizardStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {wizardStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                  </span>
                  <span className="text-xs font-bold">1. Git Source & Thư mục</span>
                </div>

                <div className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all ${wizardStep === 2 ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs' : wizardStep > 2 ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-400 bg-slate-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${wizardStep === 2 ? 'bg-blue-600 text-white' : wizardStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {wizardStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                  </span>
                  <span className="text-xs font-bold">2. Ports Allocation & .env</span>
                </div>

                <div className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all ${wizardStep === 3 ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs' : 'text-slate-400 bg-slate-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${wizardStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    3
                  </span>
                  <span className="text-xs font-bold">3. Run Deploy & PM2</span>
                </div>
              </div>

              {/* STEP 1: GIT SOURCE, REPO & DEPLOY DIR */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-4">
                    <Label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span>1. Xác định Git Repository, Branch & Thư mục lưu trữ</span>
                    </Label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Git Repository SSH/HTTPS URL</Label>
                        <Input
                          value={gitRepo}
                          onChange={(e) => handleGitRepoChange(e.target.value)}
                          placeholder="git@gitlab.com:izisoftware2020/p117qtship.git"
                          className="h-10 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Nhánh Git</Label>
                        <div className="relative">
                          <Input
                            value={gitBranch}
                            onChange={(e) => setGitBranch(e.target.value)}
                            placeholder="main"
                            list="git-branches-datalist"
                            className="h-10 text-xs font-mono font-semibold bg-white"
                          />
                          <datalist id="git-branches-datalist">
                            {availableBranches.map((b) => (
                              <option key={b} value={b} />
                            ))}
                          </datalist>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 font-sans">Gợi ý:</span>
                          {['main', 'dev', 'master', 'staging', 'production'].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setGitBranch(b)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                                gitBranch === b
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        disabled={inspecting || !gitRepo.trim()}
                        onClick={() => handleInspectRepo(gitRepo, gitBranch)}
                        className="h-9 px-4 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      >
                        {inspecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>✨ Nhận diện Repo & Sub-Apps</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Tên Dự Án</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="p117qtship"
                          className="h-9 text-xs font-semibold bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Thư Mục Lưu Trữ Trên VPS</Label>
                        <Input
                          value={workingDir}
                          onChange={(e) => setWorkingDir(e.target.value)}
                          placeholder={`/home/production-deploys/${name || 'p117qtship'}`}
                          className="h-9 text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                      Hủy bỏ
                    </Button>
                    <Button
                      size="sm"
                      disabled={inspecting || !gitRepo.trim()}
                      onClick={handleGoToStep2}
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-6 h-9 gap-1.5 font-semibold"
                    >
                      {inspecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Tiếp theo (Port & .env & Nginx)</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECTIVE MONOREPO SUB-APPS PORTS & .ENV CONFIGURATOR */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  {/* SUB-APPS SELECTOR CARDS */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Xác định các Sub-App cần Deploy trong Monorepo (Tick chọn để bật Port & .env):</span>
                    </Label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {subApps.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => toggleSubApp(app.id)}
                          className={`p-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                            app.enabled
                              ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-semibold shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold">{app.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">{app.path}</div>
                          </div>
                          {app.enabled ? <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" /> : <SquareIcon className="w-4 h-4 text-slate-300 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DYNAMIC PORTS & .ENV CARDS FOR ONLY ENABLED APPS */}
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-blue-600" />
                      <span>Cấu Hình Port & .env Tương Ứng Với {enabledApps.length} App Đã Chọn:</span>
                    </Label>

                    {enabledApps.map((app) => (
                      <div key={app.id} className={`p-4 rounded-2xl border space-y-3 ${conflictPorts[app.port] ? 'bg-rose-50/60 border-rose-300' : 'bg-slate-50 border-slate-200/80'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                          <span className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                            <FileCode className="w-4 h-4 text-blue-600" />
                            <span>{app.name} (`{app.path}/.env`)</span>
                          </span>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[11px] font-semibold text-slate-700">Port:</Label>
                              <Input
                                value={app.port}
                                onChange={(e) => updateSubAppPort(app.id, Number(e.target.value))}
                                onBlur={() => checkPortConflicts()}
                                className={`h-8 w-24 text-xs font-mono font-bold bg-white ${conflictPorts[app.port] ? 'border-rose-500 text-rose-600 ring-2 ring-rose-500/20' : 'text-blue-600'}`}
                              />
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenExpandedEnvModal(app.id, app.name, app.envText)}
                              className="h-8 text-xs gap-1.5 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 font-semibold"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>🔍 Mở Rộng Trình Chỉnh Sửa .env</span>
                            </Button>

                            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => updateSubAppEnvMode(app.id, 'PASTE')}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                  app.envMode === 'PASTE' ? 'bg-blue-600 text-white' : 'text-slate-500'
                                }`}
                              >
                                Paste Text
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSubAppEnvMode(app.id, 'FILE')}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                  app.envMode === 'FILE' ? 'bg-blue-600 text-white' : 'text-slate-500'
                                }`}
                              >
                                Upload File
                              </button>
                            </div>
                          </div>
                        </div>

                        {conflictPorts[app.port] && (
                          <div className="p-2.5 bg-rose-100/80 rounded-xl border border-rose-300 text-[11px] text-rose-800 font-semibold flex items-center gap-1.5 font-sans">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>❌ Cổng {app.port} đã tồn tại: {conflictPorts[app.port]}</span>
                          </div>
                        )}

                        {app.envMode === 'PASTE' ? (
                          <div className="relative">
                            <textarea
                              rows={app.id.includes('backend') ? 4 : 3}
                              value={app.envText}
                              onChange={(e) => updateSubAppEnv(app.id, e.target.value)}
                              className="w-full rounded-xl bg-slate-900 text-slate-100 p-3 font-mono text-xs leading-relaxed focus:outline-none select-text cursor-pointer hover:bg-slate-900/90 transition-all"
                              placeholder={`PORT=${app.port}\nNODE_ENV=production`}
                              onClick={() => handleOpenExpandedEnvModal(app.id, app.name, app.envText)}
                              title="Click để phóng to trình chỉnh sửa .env toàn màn hình"
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenExpandedEnvModal(app.id, app.name, app.envText)}
                              className="absolute right-3 top-3 px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-mono flex items-center gap-1 opacity-80 hover:opacity-100 transition-all"
                            >
                              <Maximize2 className="w-3 h-3 text-amber-400" />
                              <span>Phóng to</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-1">
                            <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-700 font-semibold">Tải file .env cho {app.name}</p>
                            <input
                              type="file"
                              accept=".env,text/plain"
                              onChange={(e) => handleFileUpload(e, app.id)}
                              className="text-xs text-slate-500 block mx-auto cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span>5. Domain Proxy Nginx (`/etc/nginx/conf.d/...conf`)</span>
                      </Label>
                      <Input
                        value={domainProxy}
                        onChange={(e) => setDomainProxy(e.target.value)}
                        placeholder="p117qtship.izisoft.io"
                        className="h-9 text-xs font-mono bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-purple-600" />
                        <span>4. Lệnh build & chạy dự án (Build Command)</span>
                      </Label>
                      <Input
                        value={buildCmd}
                        onChange={(e) => setBuildCmd(e.target.value)}
                        placeholder="pnpm install && pnpm build"
                        className="h-9 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  {/* COMPACT NGINX PREVIEW BAR WITH EXPANDED EDITOR SUB-MODAL */}
                  <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <span>/etc/nginx/conf.d/{domainProxy || `${name || 'p117qtship'}.izisoft.io`}.conf</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800 font-sans">
                            Tự Động Sinh
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Proxy Backend Port {primaryPort} & Admin Port {enabledApps.find((a) => a.id.includes('admin'))?.port || 3000}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!customNginxConfig) {
                          setCustomNginxConfig(getDefaultNginxConfig());
                        }
                        setIsNginxModalOpen(true);
                      }}
                      className="h-8 text-xs gap-1.5 bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 font-sans font-semibold shrink-0"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Xem & Chỉnh Sửa Nginx Config (Phóng To)</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => setWizardStep(1)}>
                      Quay lại
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleStartWizardDeploy}
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-8 h-10 gap-2 font-bold shadow-md"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>🚀 LƯU CẤU HÌNH & DEPLOY DỰ ÁN</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: LIVE EXECUTION CHECKLIST */}
              {wizardStep === 3 && (
                <div className="space-y-4 py-2">
                  <div className="p-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <span className="font-bold text-base">Tiến Trình Thực Thi Deploy Tự Động ({enabledApps.length} Apps)</span>
                      </div>
                      {wizardCompleted ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Hoàn thành 100%</span>
                        </span>
                      ) : (
                        <span className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang xử lý SSH trên VPS...</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      {/* Step 1 */}
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${progressStep >= 1 ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900/40 border-slate-900 text-slate-500'}`}>
                        <div className="flex items-center gap-3">
                          {progressStep > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : progressStep === 1 ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                          <span className="font-semibold">
                            1. Xác định Repo, Branch <code className="font-mono text-indigo-300">{gitBranch}</code> & Tạo thư mục{' '}
                            <code className="font-mono text-indigo-300">{workingDir || `/home/production-deploys/${name || 'p117qtship'}`}</code>
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{progressStep > 1 ? 'OK' : progressStep === 1 ? 'Running...' : 'Pending'}</span>
                      </div>

                      {/* Step 2 */}
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${progressStep >= 2 ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900/40 border-slate-900 text-slate-500'}`}>
                        <div className="flex items-center gap-3">
                          {progressStep > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : progressStep === 2 ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                          <span className="font-semibold">2. SSH Clone mã nguồn & Cài đặt dependencies</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{progressStep > 2 ? 'OK' : progressStep === 2 ? 'Running...' : 'Pending'}</span>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${progressStep >= 3 ? 'bg-slate-900 border-slate-800 text-slate-200' : progressStep === 3 ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}`}>
                        <div className="flex items-center gap-3">
                          {progressStep > 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : progressStep === 3 ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                          <span className="font-semibold">
                            3. Thiết lập file <code className="font-mono text-amber-300">.env</code> cho {enabledApps.length} Apps & Chạy{' '}
                            <code className="font-mono text-emerald-300">{buildCmd || 'pnpm install && pnpm build'}</code>
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{progressStep > 3 ? 'OK' : progressStep === 3 ? 'Running...' : 'Pending'}</span>
                      </div>

                      {/* Step 4 */}
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${progressStep >= 4 ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900/40 border-slate-900 text-slate-500'}`}>
                        <div className="flex items-center gap-3">
                          {progressStep > 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : progressStep === 4 ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                          <span className="font-semibold">
                            4. Cấu hình file Nginx VirtualHost{' '}
                            <code className="font-mono text-emerald-300">
                              /etc/nginx/conf.d/{domainProxy || `${name || 'p117qtship'}.izisoft.io`}.conf
                            </code>{' '}
                            proxy tới localhost:{primaryPort}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{progressStep > 4 ? 'OK' : progressStep === 4 ? 'Running...' : 'Pending'}</span>
                      </div>

                      {/* Step 5 */}
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${progressStep >= 5 ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900/40 border-slate-900 text-slate-500'}`}>
                        <div className="flex items-center gap-3">
                          {progressStep >= 6 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : progressStep === 5 ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                          <span className="font-semibold">
                            5. Khởi chạy PM2 với file <code className="font-mono text-blue-300">ecosystem.config.js</code> ở thư mục chính repo (<code className="font-mono text-blue-300">pm2 start ecosystem.config.js --update-env</code>)
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{progressStep >= 6 ? 'OK' : progressStep === 5 ? 'Running...' : 'Pending'}</span>
                      </div>
                    </div>

                    {deployLogs && !wizardCompleted && !deployError && (
                      <div className="space-y-1.5 pt-2 font-sans">
                        <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>Nhật Ký Thực Thi SSH VPS Thời Gian Thực:</span>
                        </div>
                        <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                          {deployLogs}
                        </pre>
                      </div>
                    )}

                    {wizardCompleted && (
                      <div className="p-5 bg-emerald-950/90 rounded-2xl border border-emerald-800 font-sans space-y-3 pt-4">
                        <div className="font-bold text-emerald-300 text-base flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <span>🎉 DỰ ÁN ĐÃ LƯU CẤU HÌNH & DEPLOY THÀNH CÔNG!</span>
                        </div>
                        <p className="text-xs text-emerald-200 leading-relaxed">
                          Tất cả các dịch vụ đã sẵn sàng và đang hoạt động liên tục trên VPS tại địa chỉ <code className="font-mono font-bold text-white">http://{domainProxy || `${name || 'p117qtship'}.izisoft.io`}</code>.
                        </p>
                        <div className="pt-2 flex items-center gap-3">
                          <Link href={`/vps/${cluster.id}/projects/${createdProjectId || name}`}>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 px-5 h-9 font-semibold">
                              <span>Mở Bảng Điều Khiển Dự Án</span>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 h-9">
                            Đóng cửa sổ
                          </Button>
                        </div>
                      </div>
                    )}

                    {deployError && (
                      <div className="p-5 bg-rose-950/90 rounded-2xl border border-rose-800 font-sans space-y-3 pt-4">
                        <div className="font-bold text-rose-300 text-base flex items-center gap-2">
                          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
                          <span>❌ DEPLOY THẤT BẠI TRÊN VPS (XEM LOG LỖI DƯỚI ĐÂY)</span>
                        </div>
                        <p className="text-xs text-rose-200 leading-relaxed">
                          Kịch bản thực thi SSH trên VPS gặp lỗi. Chi tiết nhật ký lỗi bên dưới:
                        </p>
                        <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-rose-300 font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-text">
                          {deployError}
                        </pre>
                        <div className="pt-2 flex items-center gap-3">
                          <Button size="sm" onClick={() => setWizardStep(2)} className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 px-5 h-9 font-semibold">
                            <span>Quay lại Chỉnh sửa Config/Port</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 h-9">
                            Đóng cửa sổ
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADVANCED DEV VIEW */}
          {wizardMode === 'ADVANCED' && (
            <div className="space-y-5 py-2">
              {/* Deploy Mode Tabs */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDeployTab('INITIAL')}
                  className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    deployTab === 'INITIAL' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>1. Khởi tạo & Deploy từ đầu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeployTab('RE_DEPLOY')}
                  className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    deployTab === 'RE_DEPLOY' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>2. Dự án đã deploy trước đó</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeployTab('GITLAB_CI')}
                  className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    deployTab === 'GITLAB_CI' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span>.gitlab-ci.yml & Variables</span>
                </button>
              </div>

              {deployTab !== 'GITLAB_CI' && (
                <form onSubmit={handleCreateProject} className="space-y-5">
                  {/* AUTO-DETECT PROMPT / GIT LINK INPUT */}
                  <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        <span>Dán Link Git Repository (GitLab / GitHub SSH or HTTPS)</span>
                      </Label>
                      {inspecting && (
                        <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang phân tích Sub-Apps & Nhánh...</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={gitRepo}
                        onChange={(e) => handleGitRepoChange(e.target.value)}
                        placeholder="e.g. git@gitlab.com:izisoftware2020/p117qtship.git"
                        className="h-10 text-xs font-mono bg-white flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={inspecting || !gitRepo.trim()}
                        onClick={() => handleInspectRepo()}
                        className="h-10 text-xs gap-1.5 bg-white shrink-0 text-blue-600 border-blue-200 px-4 font-semibold"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Nhận diện Link</span>
                      </Button>
                    </div>

                    {autoDetected && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Đã nhận diện {subApps.length} Sub-apps ({subApps.map((a) => a.id).join(', ')}) & {availableBranches.length} Nhánh Git từ Repository!</span>
                      </div>
                    )}
                  </div>

                  {/* DYNAMIC SELECT MONOREPO SUB-APPS */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Phát hiện {subApps.length} Sub-Apps trong Repo — Tick chọn các Sub-App cần Deploy:</span>
                    </Label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subApps.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => toggleSubApp(app.id)}
                          className={`p-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                            app.enabled
                              ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-semibold shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold">{app.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">Port {app.port} • {app.path}</div>
                          </div>
                          {app.enabled ? <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" /> : <SquareIcon className="w-4 h-4 text-slate-300 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DYNAMIC PER-APP .ENV CONFIGURATION CARDS */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>Cấu hình .env Riêng Cho Các App Đã Chọn ({subApps.filter((a) => a.enabled).length} Apps):</span>
                    </Label>

                    {subApps.filter((a) => a.enabled).map((app) => (
                      <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                            <FileCode className="w-4 h-4 text-blue-600" />
                            <span>{app.path}/.env (Port {app.port})</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateSubAppEnvMode(app.id, 'PASTE')}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                app.envMode === 'PASTE' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Copy/Paste Text
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSubAppEnvMode(app.id, 'FILE')}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                app.envMode === 'FILE' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Tải File .env
                            </button>
                          </div>
                        </div>

                        {app.envMode === 'PASTE' ? (
                          <textarea
                            rows={5}
                            value={app.envText}
                            onChange={(e) => updateSubAppEnv(app.id, e.target.value)}
                            className="w-full rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs leading-relaxed focus:outline-none select-text"
                            placeholder={`PORT=${app.port}\nNODE_ENV=production`}
                          />
                        ) : (
                          <div className="p-5 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-1">
                            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-700 font-semibold">Chọn file .env cho {app.name}</p>
                            <input
                              type="file"
                              accept=".env,text/plain"
                              onChange={(e) => handleFileUpload(e, app.id)}
                              className="text-xs text-slate-500 block mx-auto cursor-pointer pt-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* DOMAIN ROUTING STRATEGY */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>Cấu hình Domain Proxy Nginx:</span>
                    </Label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRoutingStrategy('SUBDOMAIN')}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          routingStrategy === 'SUBDOMAIN'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        <div className="font-bold text-xs">Strategy A: Subdomains (Port riêng)</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">api.domain.vn, admin.domain.vn, app.domain.vn</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoutingStrategy('PATH_PREFIX')}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          routingStrategy === 'PATH_PREFIX'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        <div className="font-bold text-xs">Strategy B: Path Prefix (Port chung)</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">domain.vn/ (Admin) & domain.vn/api/ (Backend)</div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tên Dự Án (Project Slug)</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. p117qtship"
                        className="h-9 text-xs font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Main Domain Proxy</Label>
                      <Input
                        value={domainProxy}
                        onChange={(e) => setDomainProxy(e.target.value)}
                        placeholder="e.g. p117qtship.izisoft.io"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Thư mục Deploy (DEPLOY_DIR trên VPS)</Label>
                      <Input
                        value={workingDir}
                        onChange={(e) => setWorkingDir(e.target.value)}
                        placeholder={`/home/production-deploys/${name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'p117qtship'}`}
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>Nhánh (Branch)</span>
                        {inspecting && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                      </Label>
                      <select
                        value={gitBranch}
                        onChange={(e) => setGitBranch(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {availableBranches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                      Hủy bỏ
                    </Button>
                    <Button type="submit" size="sm" disabled={creating || inspecting} className="bg-blue-600 hover:bg-blue-700 text-xs gap-2 px-6 h-10 font-bold">
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                      <span>🚀 Xác nhận & Build Các App Đã Chọn</span>
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {/* TAB 3: GITLAB CI & INTERACTIVE VARIABLES CONFIGURATOR */}
              {deployTab === 'GITLAB_CI' && (
                <div className="space-y-5 pt-2">
                  {/* INTERACTIVE VARIABLES FORM TABLE */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                        <Terminal className="w-4 h-4 text-blue-600" />
                        <span>Bảng Cấu Hình Biến GitLab CI/CD Variables (Pre-filled từ VPS):</span>
                      </div>

                      <span className="text-xs text-slate-500 font-mono">Auto-Sync via GitLab API</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                      <div className="space-y-1.5">
                        <Label className="font-sans text-xs font-semibold text-slate-700">SERVER_IP</Label>
                        <Input
                          value={ciServerIp}
                          onChange={(e) => setCiServerIp(e.target.value)}
                          className="h-9 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-sans text-xs font-semibold text-slate-700">SERVER_USER</Label>
                        <Input
                          value={ciServerUser}
                          onChange={(e) => setCiServerUser(e.target.value)}
                          className="h-9 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="font-sans text-xs font-semibold text-slate-700">DEPLOY_DIR</Label>
                        <Input
                          value={ciDeployDir}
                          onChange={(e) => setCiDeployDir(e.target.value)}
                          className="h-9 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="font-sans text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>SSH_PRIVATE_KEY (Private Key Truy Cập VPS)</span>
                        </Label>
                        <textarea
                          rows={4}
                          value={ciSshPrivateKey}
                          onChange={(e) => setCiSshPrivateKey(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 text-slate-100 p-3.5 font-mono text-xs leading-relaxed focus:outline-none select-text"
                        />
                      </div>
                    </div>

                    {/* GITLAB ACCESS TOKEN & AUTO-SYNC ACTIONS */}
                    <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/80 space-y-3 pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-blue-900">GitLab Personal / Project Access Token</Label>
                        <Input
                          type="password"
                          value={gitlabToken}
                          onChange={(e) => setGitlabToken(e.target.value)}
                          placeholder="glpat-xxxxxxxxxxxxxxxxxxxx (Optional Token)"
                          className="h-9 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          disabled={syncingVars}
                          onClick={handleSyncGitlabVariables}
                          className="h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          {syncingVars ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          <span>🤖 Tự Động Tạo CI/CD Variables Trên GitLab</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={triggeringPipeline}
                          onClick={handleTriggerPipeline}
                          className="h-9 text-xs gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                        >
                          {triggeringPipeline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          <span>🚀 Kích Hoạt Run Pipeline GitLab</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* PREVIEW GITLAB-CI.YML */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600 leading-relaxed font-bold">
                        File <code className="font-mono text-indigo-600">.gitlab-ci.yml</code> tự động sinh:
                      </p>
                      <Button size="sm" variant="outline" onClick={handleCopyGitlabCi} className="h-8 text-xs gap-1">
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy .gitlab-ci.yml</span>
                      </Button>
                    </div>

                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto max-h-72 select-text">
                      {sampleGitlabCi}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expanded .env Editor Sub-Modal */}
      <Dialog open={!!activeEnvAppId} onOpenChange={() => setActiveEnvAppId(null)}>
        <DialogContent className="w-full">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6 border-b border-slate-100 pb-3">
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <FileCode className="w-5 h-5 text-amber-600" />
                <span>Trình Chỉnh Sửa .env Toàn Màn Hình ({activeEnvAppName})</span>
              </DialogTitle>
              <span className="text-xs font-mono text-slate-500">Sub-App: {activeEnvAppId}</span>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-600 font-medium">
                Dán toàn bộ nội dung file `.env` của bạn bên dưới. Tất cả các biến môi trường sẽ được ghi đè trực tiếp lên VPS.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setExpandedEnvText(text);
                      toast.success('Đã dán từ bộ nhớ tạm (Clipboard)!');
                    }
                  } catch (e) {
                    toast.error('Không thể tự động đọc bộ nhớ tạm');
                  }
                }}
                className="h-7 text-xs gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Dán từ Clipboard</span>
              </Button>
            </div>

            <textarea
              rows={16}
              value={expandedEnvText}
              onChange={(e) => setExpandedEnvText(e.target.value)}
              className="w-full rounded-2xl bg-slate-950 text-emerald-400 p-4 font-mono text-xs leading-relaxed focus:outline-none select-text border border-slate-800 shadow-inner"
              placeholder={`PORT=4117\nNODE_ENV=production\nDATABASE_URL=postgresql://...\nJWT_SECRET=...`}
            />

            <DialogFooter className="pt-2 flex items-center justify-between border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpandedEnvText('')}
                className="text-xs text-rose-600 hover:bg-rose-50"
              >
                Xóa trắng
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveEnvAppId(null)}>
                  Hủy
                </Button>
                <Button type="button" size="sm" onClick={handleSaveExpandedEnvModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-bold px-5">
                  <Check className="w-4 h-4" />
                  <span>Lưu & Hoàn Tất .env</span>
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Nginx Config Sub-Modal */}
      <Dialog open={isNginxModalOpen} onOpenChange={setIsNginxModalOpen}>
        <DialogContent className="w-full">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6 border-b border-slate-100 pb-3">
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span>Nginx VirtualHost Config Editor (/etc/nginx/conf.d/{domainProxy || `${name || 'p117qtship'}.izisoft.io`}.conf)</span>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-600 font-medium">
                Cấu hình Nginx Reverse Proxy bên dưới sẽ được tự động ghi vào `/etc/nginx/conf.d/` và reload Nginx service trên VPS.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomNginxConfig(getDefaultNginxConfig());
                    toast.info('Đã khôi phục file Nginx mặc định!');
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Khôi phục mặc định</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(customNginxConfig || getDefaultNginxConfig());
                    toast.success('Đã sao chép Nginx Config!');
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>

            <textarea
              rows={16}
              value={customNginxConfig || getDefaultNginxConfig()}
              onChange={(e) => setCustomNginxConfig(e.target.value)}
              className="w-full rounded-2xl bg-slate-950 text-emerald-400 p-4 font-mono text-xs leading-relaxed focus:outline-none select-text border border-slate-800 shadow-inner"
            />

            <DialogFooter className="pt-2 flex items-center justify-between border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNginxModalOpen(false)}>
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsNginxModalOpen(false);
                  toast.success('Đã xác nhận file cấu hình Nginx!');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-bold px-5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu & Hoàn Tất Nginx Config</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
