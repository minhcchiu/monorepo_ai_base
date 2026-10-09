export type VpsEnvironment = 'prod' | 'staging' | 'dev';
export type VpsStatus = 'healthy' | 'warning' | 'offline';

export interface VpsClusterDetail {
  id: string;
  name: string;
  ip: string;
  port: number;
  username?: string;
  os: string;
  kernel: string;
  uptime: string;
  region: string;
  regionCode: string;
  environment: VpsEnvironment;
  status: VpsStatus;
  statusBadgeText: string;
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  networkInMbps: number;
  networkOutMbps: number;
  pm2ActiveCount: number;
  projectsCount: number;
  domainsCount: number;
  lastHeartbeat: string;
  dockerInstalled: boolean;
  nginxInstalled: boolean;
  redisInstalled: boolean;
  postgresInstalled: boolean;
}

export interface Pm2ProcessItem {
  id: number;
  name: string;
  mode: string;
  status: 'online' | 'errored' | 'stopped';
  restarts: number;
  cpuPercent: number;
  memoryMb: number;
  uptime: string;
  user: string;
}

export interface VpsFileItem {
  id: string;
  name: string;
  path: string;
  size: string;
  type: 'file' | 'directory';
  permissions: string;
  lastModified: string;
}

export interface VpsCronItem {
  id: string;
  schedule: string;
  command: string;
  comment: string;
  active: boolean;
  lastRunAgo: string;
}

export interface VpsDomainItem {
  id: string;
  domainName: string;
  targetApp: string;
  sslStatus: 'valid' | 'expiring' | 'error';
  sslExpiryDays: number;
  httpPort: number;
}

export interface VpsBackupItem {
  id: string;
  filename: string;
  type: 'database' | 'snapshot' | 'storage' | 'configs';
  size: string;
  createdAt: string;
  checksum: string;
}
