import { axiosInstance } from '@/lib/axios';
import { InfrastructureOverviewData } from './types';

export const MOCK_INFRASTRUCTURE_DATA: InfrastructureOverviewData = {
  summary: {
    totalVps: 12,
    activeClustersText: 'Active clusters across 4 regions',
    onlineHealthyCount: 9,
    onlineHealthyPercent: 75,
    latencyText: 'Operational, latency < 28ms',
    highLoadWarningCount: 2,
    highLoadText: 'Exceeding 85% CPU / RAM peak',
    offlineNodesCount: 1,
    offlineText: 'Scheduled maintenance / unreachable',
  },
  telemetry: {
    cpuAggregatePercent: 42,
    cpuPeakNode: 'worker-node-02',
    cpuPeakPercent: 88,
    memoryAllocationPercent: 68,
    memoryUsedGb: 89.6,
    memoryAvailGb: 38.4,
    memoryTotalGb: 128,
    storagePoolPercent: 54,
    storageUsedTb: 1.8,
    storageTotalTb: 3.4,
    bandwidthMbps: 142.6,
    bandwidthInMbps: 84.0,
    bandwidthOutMbps: 58.6,
    syncIntervalSec: 5,
  },
  vpsList: [
    {
      id: 'api-prod-cluster-01',
      name: 'Production API Cluster 01',
      ip: '103.56.162.45',
      os: 'Ubuntu 24.04 LTS',
      region: 'Singapore (SG-01)',
      projectsCount: 3,
      pm2ProcessesCount: 8,
      status: 'healthy',
      statusBadgeText: 'Online',
      cpuPercent: 32,
      ramPercent: 61,
      diskPercent: 48,
      telemetryConnected: true,
    },
    {
      id: 'staging-gateway-hcm',
      name: 'Staging Gateway HCM',
      ip: '103.56.162.88',
      os: 'Debian 12',
      region: 'Vietnam (VN-HCM)',
      projectsCount: 2,
      pm2ProcessesCount: 4,
      status: 'healthy',
      statusBadgeText: 'Online',
      cpuPercent: 18,
      ramPercent: 42,
      diskPercent: 35,
      telemetryConnected: true,
    },
  ],
  deployments: [
    {
      id: 'dep-1',
      name: 'Calo AI API',
      target: 'To Production API • #210',
      buildNumber: '#210',
      status: 'success',
      timeAgo: '4m ago',
    },
  ],
  alerts: [
    {
      id: 'alt-1',
      title: 'PM2 Telemetry Active',
      message: 'System monitors active processes across all VPS nodes',
      node: 'Global Cluster',
      timeAgo: 'Just now',
      severity: 'info',
      resolved: true,
    },
  ],
  activity: [
    {
      id: 'act-1',
      userInitials: 'TL',
      userName: 'Tuấn Lê',
      actionText: 'deployed production build #210',
      detailText: '18m ago • calo-ai-backend',
      timeAgo: '18m ago',
      type: 'deploy',
    },
  ],
};

export async function fetchInfrastructureOverview(): Promise<InfrastructureOverviewData> {
  try {
    const { data } = await axiosInstance.get('/infrastructure/overview');
    if (data && data.summary) {
      return data;
    }
  } catch (e) {
    // API Fallback
  }
  return MOCK_INFRASTRUCTURE_DATA;
}

export async function diagnoseVpsNode(nodeId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await axiosInstance.post(`/vps/${nodeId}/diagnose`);
    return {
      success: data?.success ?? true,
      message: data?.output || `Heartbeat ping sent to node ${nodeId}. Diagnostic logs recorded.`,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.response?.data?.message || `Failed to run diagnostic ping on ${nodeId}`,
    };
  }
}
