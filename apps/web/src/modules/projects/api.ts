import { axiosInstance } from '@/lib/axios';
import { ProjectItem } from './types';

export const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'calo-ai-backend',
    name: 'Calo AI Backend API',
    engine: 'NestJS / Node.js 20',
    hostVpsName: 'Production API Cluster 01',
    hostVpsIp: '103.56.162.45',
    environment: 'prod',
    status: 'running',
    pm2Instances: '8 cluster workers',
    port: 3000,
    domainProxy: 'api.calo.io',
    gitBranch: 'main',
    gitHash: 'c9f82a1',
    lastRolloutAgo: '18m ago',
    cpuPercent: 12.4,
    memoryMb: 184.2,
  },
  {
    id: 'calo-auth-identity',
    name: 'Calo Auth Identity',
    engine: 'Express / TypeScript',
    hostVpsName: 'Staging Gateway HCM',
    hostVpsIp: '103.56.162.88',
    environment: 'staging',
    status: 'running',
    pm2Instances: '4 fork processes',
    port: 3001,
    domainProxy: 'auth.calo.io',
    gitBranch: 'staging',
    gitHash: 'a8190d4',
    lastRolloutAgo: '2h ago',
    cpuPercent: 2.1,
    memoryMb: 94.6,
  },
];

export async function syncPm2ProjectsApi(vpsId: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/sync-pm2`);
  return data;
}

export async function inspectProjectRepoApi(
  vpsId: string,
  gitRepo: string,
  branch?: string,
  projectId?: string,
  workingDir?: string,
) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/inspect-repo`, {
    gitRepo,
    branch,
    projectId,
    workingDir,
  });
  return data;
}

export async function createProjectApi(vpsId: string, payload: {
  name: string;
  description?: string;
  engine?: string;
  environment?: string;
  port?: number;
  domainProxy?: string;
  gitRepo?: string;
  gitBranch?: string;
  workingDir?: string;
  pm2Instances?: string;
}) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects`, payload);
  return data;
}

export async function fetchProjects(vpsId?: string): Promise<ProjectItem[]> {
  if (vpsId) {
    try {
      const { data } = await axiosInstance.get(`/vps/${vpsId}/projects`);
      if (Array.isArray(data)) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          engine: p.engine,
          hostVpsName: p.vps?.name || 'VPS Server',
          hostVpsIp: p.vps?.ip || '103.56.162.45',
          environment: p.environment,
          status: p.status?.toLowerCase() || 'running',
          pm2Instances: p.pm2Instances || '1 process',
          port: p.port || 3000,
          domainProxy: p.domainProxy || `${p.id}.io`,
          gitBranch: p.gitBranch || 'main',
          gitHash: p.gitHash || 'head',
          gitRepo: p.gitRepo,
          workingDir: p.workingDir,
          lastRolloutAgo: 'Recently',
          cpuPercent: p.cpuPercent || 0,
          memoryMb: p.memoryMb || 0,
          syncStatus: p.syncStatus || 'SYNCED',
          syncStatusText: p.syncStatusText || 'Đã đồng bộ',
        }));
      }
    } catch (e) {
      // Fallback on error
    }
  } else {
    try {
      const { data } = await axiosInstance.get('/projects');
      if (Array.isArray(data)) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          engine: p.engine,
          hostVpsName: p.vps?.name || 'VPS Server',
          hostVpsIp: p.vps?.ip || '103.56.162.45',
          environment: p.environment,
          status: p.status?.toLowerCase() || 'running',
          pm2Instances: p.pm2Instances || '1 process',
          port: p.port || 3000,
          domainProxy: p.domainProxy || `${p.id}.io`,
          gitBranch: p.gitBranch || 'main',
          gitHash: p.gitHash || 'head',
          gitRepo: p.gitRepo,
          workingDir: p.workingDir,
          lastRolloutAgo: 'Recently',
          cpuPercent: p.cpuPercent || 0,
          memoryMb: p.memoryMb || 0,
          syncStatus: p.syncStatus || 'SYNCED',
          syncStatusText: p.syncStatusText || 'Đã đồng bộ',
        }));
      }
    } catch (e) {
      // Fallback
    }
  }
  return MOCK_PROJECTS;
}

export async function fetchProjectDetail(vpsId: string, projectId: string): Promise<ProjectItem> {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}`);
    if (data) {
      return data;
    }
  } catch (e) {
    // Fallback
  }
  return MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
}

export async function fetchProjectOverview(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/overview`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function fetchProjectRuntime(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/runtime`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function updateProjectRuntimeApi(vpsId: string, projectId: string, payload: {
  engine?: string;
  execMode?: string;
  instances?: string | number;
  entryPoint?: string;
}) {
  const { data } = await axiosInstance.patch(`/vps/${vpsId}/projects/${projectId}/runtime`, payload);
  return data;
}

export async function restartProjectRuntime(vpsId: string, projectId: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/runtime/restart`);
  return data;
}

export async function stopProjectRuntime(vpsId: string, projectId: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/runtime/stop`);
  return data;
}

export async function startProjectRuntime(vpsId: string, projectId: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/runtime/start`);
  return data;
}

export async function fetchProjectLogs(vpsId: string, projectId: string, filter?: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/logs`, {
      params: { filter },
    });
    return data;
  } catch (e) {
    return null;
  }
}

export async function fetchProjectDeployments(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/deployments`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function triggerProjectDeployment(
  vpsId: string,
  projectId: string,
  payload: {
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
  } | string = {},
) {
  const body = typeof payload === 'string' ? { author: payload } : payload;
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/deployments`, body);
  return data;
}

export async function fetchProjectGitlabCiConfigApi(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/gitlab-ci`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function syncGitlabVariablesApi(vpsId: string, payload: {
  gitRepo: string;
  gitlabToken?: string;
  variables: Array<{ key: string; value: string; masked?: boolean }>;
}) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/sync-gitlab-variables`, payload);
  return data;
}

export async function triggerGitlabPipelineApi(vpsId: string, payload: {
  gitRepo: string;
  gitlabToken?: string;
  branch?: string;
}) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/trigger-gitlab-pipeline`, payload);
  return data;
}

export async function rollbackProjectDeployment(vpsId: string, projectId: string, deploymentId: string) {
  const { data } = await axiosInstance.post(
    `/vps/${vpsId}/projects/${projectId}/deployments/${deploymentId}/rollback`,
  );
  return data;
}

export async function fetchProjectSource(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/source`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function updateProjectSourceApi(vpsId: string, projectId: string, payload: { gitRepo?: string; gitBranch?: string }) {
  const { data } = await axiosInstance.patch(`/vps/${vpsId}/projects/${projectId}/source`, payload);
  return data;
}

export async function gitPullProjectSource(vpsId: string, projectId: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/source/pull`);
  return data;
}

export async function fetchProjectEnvironment(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/environment`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function saveProjectEnvironment(vpsId: string, projectId: string, vars: Array<{ key: string; value: string }>) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/environment`, { vars });
  return data;
}

export async function fetchProjectDomains(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/domains`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function addProjectDomain(vpsId: string, projectId: string, body: { domainName: string; targetPort?: number }) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/domains`, body);
  return data;
}

export async function removeProjectDomain(vpsId: string, projectId: string, domainId: string) {
  const { data } = await axiosInstance.delete(`/vps/${vpsId}/projects/${projectId}/domains/${domainId}`);
  return data;
}

export async function issueProjectDomainSsl(vpsId: string, projectId: string, domainId: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/domains/${domainId}/ssl`);
  return data;
}

export async function fetchProjectNginxConfig(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/nginx`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function generateProjectNginxConfigApi(vpsId: string, projectId: string, payload?: {
  routingStrategy?: 'SUBDOMAIN' | 'PATH_PREFIX';
  baseDomain?: string;
  backendPort?: number;
  adminPort?: number;
  webPort?: number;
}) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/nginx/generate`, payload);
  return data;
}

export async function testProjectNginxConfig(vpsId: string, projectId: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/nginx/test`);
  return data;
}

export async function saveProjectNginxConfig(vpsId: string, projectId: string, config: string) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/nginx`, { config });
  return data;
}

export async function fetchProjectMonitoring(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/monitoring`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function fetchProjectStorage(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/storage`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function fetchProjectActivity(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/activity`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function checkPortsAvailabilityApi(vpsId: string, ports: number[], excludeProjectId?: string) {
  try {
    const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/check-ports`, {
      ports,
      excludeProjectId,
    });
    return data;
  } catch (e: any) {
    return { success: false, hasConflicts: false, ports: [], usedPorts: [] };
  }
}

export async function fetchProjectPortsApi(vpsId: string, projectId: string) {
  try {
    const { data } = await axiosInstance.get(`/vps/${vpsId}/projects/${projectId}/ports`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function updateProjectPortsApi(vpsId: string, projectId: string, payload: {
  backendPort?: number;
  adminPort?: number;
  webPort?: number;
}) {
  const { data } = await axiosInstance.post(`/vps/${vpsId}/projects/${projectId}/ports/update`, payload);
  return data;
}

export async function updateProjectSettings(vpsId: string, projectId: string, body: any) {
  const { data } = await axiosInstance.patch(`/vps/${vpsId}/projects/${projectId}/settings`, body);
  return data;
}

export async function removeProjectScope(vpsId: string, projectId: string) {
  const { data } = await axiosInstance.delete(`/vps/${vpsId}/projects/${projectId}`);
  return data;
}
