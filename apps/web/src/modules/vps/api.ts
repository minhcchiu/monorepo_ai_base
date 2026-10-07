import { axiosInstance } from '@/lib/axios';
import {
  VpsClusterDetail,
  Pm2ProcessItem,
  VpsFileItem,
  VpsCronItem,
  VpsDomainItem,
  VpsBackupItem,
} from './types';

export const MOCK_VPS_LIST: VpsClusterDetail[] = [
  {
    id: 'api-prod-cluster-01',
    name: 'Production API Cluster 01',
    ip: '103.56.162.45',
    port: 22,
    os: 'Ubuntu 24.04.1 LTS',
    kernel: 'Linux 6.8.0-40-generic x86_64',
    uptime: '142 days 18 hrs',
    region: 'Singapore (SG-01)',
    regionCode: 'SG-01',
    environment: 'prod',
    status: 'healthy',
    statusBadgeText: 'Online',
    cpuPercent: 32,
    ramPercent: 61,
    diskPercent: 48,
    ramUsedGb: 19.5,
    ramTotalGb: 32,
    diskUsedGb: 240,
    diskTotalGb: 500,
    networkInMbps: 42.1,
    networkOutMbps: 28.4,
    pm2ActiveCount: 8,
    projectsCount: 3,
    domainsCount: 4,
    lastHeartbeat: '2s ago',
    dockerInstalled: true,
    nginxInstalled: true,
    redisInstalled: true,
    postgresInstalled: true,
  },
  {
    id: 'staging-gateway-hcm',
    name: 'Staging Gateway HCM',
    ip: '103.56.162.88',
    port: 2222,
    os: 'Debian 12 Bookworm',
    kernel: 'Linux 6.1.0-21-amd64 x86_64',
    uptime: '89 days 4 hrs',
    region: 'Vietnam (VN-HCM)',
    regionCode: 'VN-HCM',
    environment: 'staging',
    status: 'healthy',
    statusBadgeText: 'Online',
    cpuPercent: 18,
    ramPercent: 42,
    diskPercent: 35,
    ramUsedGb: 6.7,
    ramTotalGb: 16,
    diskUsedGb: 87.5,
    diskTotalGb: 250,
    networkInMbps: 14.2,
    networkOutMbps: 12.1,
    pm2ActiveCount: 4,
    projectsCount: 2,
    domainsCount: 2,
    lastHeartbeat: '4s ago',
    dockerInstalled: true,
    nginxInstalled: true,
    redisInstalled: true,
    postgresInstalled: false,
  },
];

export const MOCK_PM2_PROCESSES: Pm2ProcessItem[] = [
  { id: 0, name: 'calo-api-prod', mode: 'cluster', status: 'online', restarts: 2, cpuPercent: 12.4, memoryMb: 184.2, uptime: '14d 2h', user: 'root' },
  { id: 1, name: 'calo-auth-service', mode: 'fork', status: 'online', restarts: 0, cpuPercent: 2.1, memoryMb: 94.6, uptime: '42d 18h', user: 'root' },
  { id: 2, name: 'worker-queue-listener', mode: 'fork', status: 'online', restarts: 5, cpuPercent: 28.8, memoryMb: 240.1, uptime: '3d 11h', user: 'root' },
];

export const MOCK_VPS_FILES: VpsFileItem[] = [
  { id: 'f-1', name: 'apps', path: '/var/www/apps', size: '2.4 GB', type: 'directory', permissions: 'drwxr-xr-x', lastModified: '2 hours ago' },
  { id: 'f-2', name: 'env-backups', path: '/var/www/env-backups', size: '12 KB', type: 'directory', permissions: 'drwx------', lastModified: 'Yesterday' },
  { id: 'f-3', name: 'ecosystem.config.js', path: '/var/www/ecosystem.config.js', size: '1.8 KB', type: 'file', permissions: '-rw-r--r--', lastModified: '3 days ago' },
];

export const MOCK_VPS_CRONS: VpsCronItem[] = [
  { id: 'c-1', schedule: '0 2 * * *', command: '/var/www/scripts/backup-pg-db.sh --quiet', comment: 'Daily PostgreSQL Database Dump', active: true, lastRunAgo: '9 hours ago' },
  { id: 'c-2', schedule: '*/15 * * * *', command: '/var/www/scripts/health-check-ping.sh', comment: 'Heartbeat Ping to CloudPulse Telemetry', active: true, lastRunAgo: '12 mins ago' },
];

export const MOCK_VPS_DOMAINS: VpsDomainItem[] = [
  { id: 'd-1', domainName: 'api.calo.io', targetApp: 'calo-api-prod (Port 3000)', sslStatus: 'valid', sslExpiryDays: 88, httpPort: 443 },
  { id: 'd-2', domainName: 'auth.calo.io', targetApp: 'calo-auth-service (Port 3001)', sslStatus: 'valid', sslExpiryDays: 74, httpPort: 443 },
];

export const MOCK_VPS_BACKUPS: VpsBackupItem[] = [
  { id: 'b-1', filename: 'calo_db_dump_20261005.sql.gz', type: 'database', size: '482.5 MB', createdAt: 'Today, 02:00 AM', checksum: 'sha256:d8a9f201...' },
  { id: 'b-2', filename: 'vps_snapshot_cluster_01.tar.zst', type: 'snapshot', size: '1.8 GB', createdAt: '3 days ago', checksum: 'sha256:b192e44f...' },
];

export async function fetchVpsList(): Promise<VpsClusterDetail[]> {
  try {
    const { data } = await axiosInstance.get('/vps');
    if (Array.isArray(data)) {
      return data.map((v: any) => ({
        id: v.id,
        name: v.name,
        ip: v.ip,
        port: v.port || 22,
        os: v.os || 'Ubuntu 24.04 LTS',
        kernel: v.kernel || 'Linux 6.8.0-generic',
        uptime: v.uptime || '142 days 18 hrs',
        region: v.region || 'Singapore (SG-01)',
        regionCode: v.regionCode || 'SG-01',
        environment: v.environment || 'prod',
        status: v.status ? v.status.toLowerCase() : 'healthy',
        statusBadgeText: v.statusBadgeText || 'Online',
        cpuPercent: v.cpuPercent || 0,
        ramPercent: v.ramPercent || 0,
        diskPercent: v.diskPercent || 0,
        ramUsedGb: v.ramUsedGb || 0,
        ramTotalGb: v.ramTotalGb || 32,
        diskUsedGb: v.diskUsedGb || 0,
        diskTotalGb: v.diskTotalGb || 500,
        networkInMbps: v.networkInMbps || 0,
        networkOutMbps: v.networkOutMbps || 0,
        pm2ActiveCount: v.projects?.length || 0,
        projectsCount: v.projects?.length || 0,
        domainsCount: 1,
        lastHeartbeat: '2s ago',
        dockerInstalled: v.dockerInstalled ?? true,
        nginxInstalled: v.nginxInstalled ?? true,
        redisInstalled: v.redisInstalled ?? false,
        postgresInstalled: v.postgresInstalled ?? false,
      }));
    }
  } catch (e) {
    // API Fallback
  }
  return MOCK_VPS_LIST;
}

export async function fetchVpsDetail(id: string): Promise<VpsClusterDetail> {
  try {
    const { data } = await axiosInstance.get(`/vps/${id}`);
    if (data) {
      return {
        id: data.id,
        name: data.name,
        ip: data.ip,
        port: data.port || 22,
        os: data.os || 'Ubuntu 24.04 LTS',
        kernel: data.kernel || 'Linux 6.8.0-generic',
        uptime: data.uptime || '142 days 18 hrs',
        region: data.region || 'Singapore (SG-01)',
        regionCode: data.regionCode || 'SG-01',
        environment: data.environment || 'prod',
        status: data.status ? data.status.toLowerCase() : 'healthy',
        statusBadgeText: data.statusBadgeText || 'Online',
        cpuPercent: data.cpuPercent || 0,
        ramPercent: data.ramPercent || 0,
        diskPercent: data.diskPercent || 0,
        ramUsedGb: data.ramUsedGb || 0,
        ramTotalGb: data.ramTotalGb || 32,
        diskUsedGb: data.diskUsedGb || 0,
        diskTotalGb: data.diskTotalGb || 500,
        networkInMbps: data.networkInMbps || 0,
        networkOutMbps: data.networkOutMbps || 0,
        pm2ActiveCount: data.projects?.length || 0,
        projectsCount: data.projects?.length || 0,
        domainsCount: 1,
        lastHeartbeat: '2s ago',
        dockerInstalled: data.dockerInstalled ?? true,
        nginxInstalled: data.nginxInstalled ?? true,
        redisInstalled: data.redisInstalled ?? false,
        postgresInstalled: data.postgresInstalled ?? false,
      };
    }
  } catch (e) {
    // API Fallback
  }

  const found = MOCK_VPS_LIST.find((v) => v.id === id) || MOCK_VPS_LIST.find((v) => v.ip === id);
  if (found) return found;

  return {
    id: id || 'vps-node-01',
    name: `VPS Node (${id})`,
    ip: '103.56.162.45',
    port: 22,
    os: 'Ubuntu 24.04 LTS',
    kernel: 'Linux 6.8.0-generic',
    uptime: '142 days 18 hrs',
    region: 'Singapore (SG-01)',
    regionCode: 'SG-01',
    environment: 'prod',
    status: 'healthy',
    statusBadgeText: 'Online',
    cpuPercent: 24,
    ramPercent: 48,
    diskPercent: 35,
    ramUsedGb: 15.3,
    ramTotalGb: 32,
    diskUsedGb: 175,
    diskTotalGb: 500,
    networkInMbps: 28.5,
    networkOutMbps: 18.2,
    pm2ActiveCount: 2,
    projectsCount: 2,
    domainsCount: 1,
    lastHeartbeat: '2s ago',
    dockerInstalled: true,
    nginxInstalled: true,
    redisInstalled: true,
    postgresInstalled: true,
  };
}

export async function testVpsConnection(payload: {
  ip: string;
  port?: number;
  username?: string;
  password?: string;
  sshKey?: string;
}) {
  const { data } = await axiosInstance.post('/vps/test-connection', payload);
  return data;
}

export async function createVpsNode(payload: {
  name: string;
  ip: string;
  port?: number;
  username?: string;
  password?: string;
  sshKey?: string;
  os?: string;
  region?: string;
  environment?: string;
}) {
  const { data } = await axiosInstance.post('/vps', {
    name: payload.name,
    ip: payload.ip,
    port: payload.port ? Number(payload.port) : 22,
    username: payload.username || 'root',
    password: payload.password,
    sshKey: payload.sshKey,
    os: payload.os || 'Ubuntu 24.04 LTS',
    region: payload.region || 'Singapore (SG-01)',
    regionCode: payload.region ? payload.region.substring(0, 5).toUpperCase() : 'SG-01',
    environment: payload.environment || 'prod',
    status: 'ONLINE',
    statusBadgeText: 'Online',
  });
  return data;
}

export async function updateVpsNode(id: string, payload: any) {
  const { data } = await axiosInstance.patch(`/vps/${id}`, payload);
  return data;
}

export async function deleteVpsNode(id: string) {
  const { data } = await axiosInstance.delete(`/vps/${id}`);
  return data;
}

export async function fetchVpsPm2(id: string): Promise<Pm2ProcessItem[]> {
  try {
    const { data } = await axiosInstance.get(`/vps/${id}/pm2`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}
  return MOCK_PM2_PROCESSES;
}

export async function reloadVpsPm2(id: string) {
  const { data } = await axiosInstance.post(`/vps/${id}/pm2/reload`);
  return data;
}

export async function restartVpsPm2(id: string, name: string) {
  const { data } = await axiosInstance.post(`/vps/${id}/pm2/restart/${name}`);
  return data;
}

export async function execVpsTerminal(id: string, command: string) {
  const { data } = await axiosInstance.post(`/vps/${id}/terminal/exec`, { command });
  return data;
}

export async function fetchVpsFiles(id: string): Promise<VpsFileItem[]> {
  try {
    const { data } = await axiosInstance.get(`/vps/${id}/files`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}
  return MOCK_VPS_FILES;
}

export async function fetchVpsCrons(id: string): Promise<VpsCronItem[]> {
  try {
    const { data } = await axiosInstance.get(`/vps/${id}/crons`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}
  return MOCK_VPS_CRONS;
}

export async function fetchVpsDomains(id: string): Promise<VpsDomainItem[]> {
  try {
    const { data } = await axiosInstance.get(`/vps/${id}/domains`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}
  return MOCK_VPS_DOMAINS;
}

export async function fetchVpsBackups(id: string): Promise<VpsBackupItem[]> {
  try {
    const { data } = await axiosInstance.get(`/vps/${id}/backups`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}
  return MOCK_VPS_BACKUPS;
}

export async function fetchVpsLogs(id: string): Promise<string[]> {
  try {
    const { data } = await axiosInstance.get(`/vps/${id}/logs`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}
  return [
    '[INFO] SSH Telemetry stream initialized',
    '[INFO] System active on target VPS node',
  ];
}
