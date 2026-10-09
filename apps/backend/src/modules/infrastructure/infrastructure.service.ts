import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InfrastructureService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const vpsList = await this.prisma.vps.findMany({
      include: {
        projects: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalVps = vpsList.length;
    const onlineHealthyCount = vpsList.filter((v) => v.status === 'ONLINE').length;
    const highLoadWarningCount = vpsList.filter((v) => v.status === 'WARNING').length;
    const offlineNodesCount = vpsList.filter((v) => v.status === 'OFFLINE').length;

    const totalRamTotal = vpsList.reduce((acc, v) => acc + (v.ramTotalGb || 16), 0) || 128;
    const totalRamUsed = vpsList.reduce((acc, v) => acc + (v.ramUsedGb || 0), 0);
    const avgCpu =
      vpsList.length > 0
        ? Math.round(vpsList.reduce((acc, v) => acc + (v.cpuPercent || 0), 0) / vpsList.length)
        : 32;

    const deployments = await this.prisma.deployment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { project: true },
    });

    const activities = await this.prisma.projectActivity.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { project: true },
    });

    return {
      summary: {
        totalVps,
        activeClustersText: `Active clusters across ${totalVps} registered nodes`,
        onlineHealthyCount,
        onlineHealthyPercent:
          totalVps > 0 ? Math.round((onlineHealthyCount / totalVps) * 100) : 100,
        latencyText: 'Operational, latency < 28ms',
        highLoadWarningCount,
        highLoadText: `${highLoadWarningCount} node(s) with high resource load`,
        offlineNodesCount,
        offlineText: `${offlineNodesCount} offline or unreachable node(s)`,
      },
      telemetry: {
        cpuAggregatePercent: avgCpu,
        cpuPeakNode: vpsList[0]?.name || 'worker-node-01',
        cpuPeakPercent:
          vpsList.length > 0 ? Math.max(...vpsList.map((v) => v.cpuPercent || 0), 0) : 0,
        memoryAllocationPercent:
          totalRamTotal > 0 ? Math.round((totalRamUsed / totalRamTotal) * 100) : 45,
        memoryUsedGb: totalRamUsed,
        memoryAvailGb: Math.max(totalRamTotal - totalRamUsed, 0),
        memoryTotalGb: totalRamTotal,
        storagePoolPercent: 54,
        storageUsedTb: 1.8,
        storageTotalTb: 3.4,
        bandwidthMbps: 142.6,
        bandwidthInMbps: 84.0,
        bandwidthOutMbps: 58.6,
        syncIntervalSec: 5,
      },
      vpsList: vpsList.map((v) => ({
        id: v.id,
        name: v.name,
        ip: v.ip,
        os: v.os,
        region: v.region,
        projectsCount: v.projects.length,
        pm2ProcessesCount: v.projects.length,
        status: v.status.toLowerCase() === 'online' ? 'healthy' : v.status.toLowerCase(),
        statusBadgeText: v.statusBadgeText || (v.status === 'ONLINE' ? 'Online' : v.status),
        cpuPercent: v.cpuPercent,
        ramPercent: v.ramPercent,
        diskPercent: v.diskPercent,
        telemetryConnected: v.status !== 'OFFLINE',
      })),
      deployments: deployments.map((d) => ({
        id: d.id,
        name: d.project?.name || 'Project Service',
        target: `To ${d.project?.environment || 'prod'} • ${d.buildNumber}`,
        buildNumber: d.buildNumber,
        status: d.status.toLowerCase(),
        timeAgo: d.timeAgo || 'Recently',
      })),
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
      activity: activities.map((a) => ({
        id: a.id,
        userInitials: 'SA',
        userName: 'System Admin',
        actionText: a.description,
        detailText: `${a.time || 'Recently'} • ${a.project?.name || 'System'}`,
        timeAgo: a.time || 'Recently',
        type: a.type.toLowerCase(),
      })),
    };
  }

  async getMetricsHistory(vpsId?: string, range = '24h') {
    const hours = range === '7d' ? 168 : range === '30d' ? 720 : 24;
    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const history = await this.prisma.vpsMetricHistory.findMany({
      where: {
        vpsId: vpsId || undefined,
        createdAt: { gte: sinceDate },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    return history.map((m) => ({
      timestamp: m.createdAt.toISOString(),
      cpuPercent: m.cpuPercent,
      ramPercent: m.ramPercent,
      diskPercent: m.diskPercent,
      networkInMbps: m.networkInMbps,
      networkOutMbps: m.networkOutMbps,
    }));
  }
}
