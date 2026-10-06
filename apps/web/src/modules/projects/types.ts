export interface ProjectItem {
  id: string;
  name: string;
  engine: string;
  hostVpsName: string;
  hostVpsIp: string;
  environment: 'prod' | 'staging' | 'dev';
  status: 'running' | 'degraded' | 'error' | 'stopped';
  pm2Instances: string;
  port: number;
  domainProxy: string;
  gitBranch: string;
  gitHash: string;
  gitRepo?: string;
  workingDir?: string;
  entryPoint?: string;
  runtimeEngine?: 'node' | 'python' | 'docker';
  lastRolloutAgo: string;
  cpuPercent: number;
  memoryMb: number;
  syncStatus?: 'SYNCED' | 'NEW' | 'REMOVED';
  syncStatusText?: string;
  description?: string;
}

export interface ProjectDomainItem {
  id: string;
  domainName: string;
  targetPort: number;
  sslStatus: 'VALID' | 'PENDING' | 'EXPIRED' | 'ERROR';
  sslExpiryDays: number;
  httpPort?: number;
}

export interface DeploymentItem {
  id: string;
  buildNumber: string;
  commitHash: string;
  branch: string;
  author: string;
  status: 'SUCCESS' | 'FAILED' | 'BUILDING';
  timeAgo: string;
  triggeredBy?: string;
  logs?: string;
}

export interface EnvVar {
  key: string;
  value: string;
}

export interface LinkedDatabase {
  id: string;
  name: string;
  type: 'PostgreSQL' | 'MySQL' | 'Redis' | 'MongoDB';
  host: string;
  port: number;
  status: 'CONNECTED' | 'DISCONNECTED';
}

export interface ProjectStorageInfo {
  workingDirectory: string;
  totalDiskUsage: string;
  codeSize: string;
  nodeModulesSize: string;
  logsSize: string;
  linkedDatabase?: LinkedDatabase;
}

export interface ProjectActivityItem {
  id: string;
  type: 'DEPLOY' | 'PM2' | 'ENV' | 'DOMAIN' | 'NGINX' | 'SYSTEM';
  title: string;
  description: string;
  time: string;
}
