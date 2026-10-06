export type VpsStatus = 'healthy' | 'warning' | 'offline';
export type VpsFilter = 'all' | 'attention';

export interface InfrastructureSummary {
  totalVps: number;
  activeClustersText: string;
  onlineHealthyCount: number;
  onlineHealthyPercent: number;
  latencyText: string;
  highLoadWarningCount: number;
  highLoadText: string;
  offlineNodesCount: number;
  offlineText: string;
}

export interface GlobalTelemetry {
  cpuAggregatePercent: number;
  cpuPeakNode: string;
  cpuPeakPercent: number;
  memoryAllocationPercent: number;
  memoryUsedGb: number;
  memoryAvailGb: number;
  memoryTotalGb: number;
  storagePoolPercent: number;
  storageUsedTb: number;
  storageTotalTb: number;
  bandwidthMbps: number;
  bandwidthInMbps: number;
  bandwidthOutMbps: number;
  syncIntervalSec: number;
}

export interface VpsNode {
  id: string;
  name: string;
  ip: string;
  os: string;
  region: string;
  projectsCount: number;
  pm2ProcessesCount: number;
  status: VpsStatus;
  statusBadgeText: string;
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  telemetryConnected: boolean;
  alertNote?: string;
}

export interface DeploymentItem {
  id: string;
  name: string;
  target: string;
  buildNumber: string;
  status: 'success' | 'running' | 'failed';
  timeAgo: string;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  node: string;
  timeAgo: string;
  severity: 'critical' | 'warning' | 'info';
  resolved: boolean;
}

export interface ActivityItem {
  id: string;
  userInitials: string;
  userName: string;
  actionText: string;
  detailText: string;
  timeAgo: string;
  type: 'deploy' | 'pm2' | 'system';
}

export interface InfrastructureOverviewData {
  summary: InfrastructureSummary;
  telemetry: GlobalTelemetry;
  vpsList: VpsNode[];
  deployments: DeploymentItem[];
  alerts: AlertItem[];
  activity: ActivityItem[];
}
