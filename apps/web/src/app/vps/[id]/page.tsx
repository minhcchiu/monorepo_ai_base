'use client';

import { use } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, HardDrive, Server, Shield, Activity, Terminal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VpsOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);

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

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>CPU Utilization</span>
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 tracking-tight font-mono">
              {cluster.cpuPercent}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${cluster.cpuPercent}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">16 vCPU Cores @ 2.80GHz</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>RAM Allocation</span>
              <Server className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 tracking-tight font-mono">
              {cluster.ramPercent}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${cluster.ramPercent}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {cluster.ramUsedGb} GB Used / {cluster.ramTotalGb} GB Total
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Storage Usage</span>
              <HardDrive className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 tracking-tight font-mono">
              {cluster.diskPercent}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-slate-700 h-2 rounded-full" style={{ width: `${cluster.diskPercent}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {cluster.diskUsedGb} GB / {cluster.diskTotalGb} GB NVMe SSD
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Network Traffic</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-semibold text-emerald-700 tracking-tight font-mono">
              {cluster.networkInMbps} Mbps
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 pt-1">
              <span>↓ {cluster.networkInMbps} Mbps In</span>
              <span>↑ {cluster.networkOutMbps} Mbps Out</span>
            </div>
          </div>
        </div>

        {/* Quick Quick Actions Bar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Cluster Quick Shortcuts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href={`/vps/${cluster.id}/terminal`}>
              <Button variant="outline" className="w-full h-12 flex items-center justify-center gap-2 text-xs font-semibold">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span>Web SSH Shell</span>
              </Button>
            </Link>
            <Link href={`/vps/${cluster.id}/pm2`}>
              <Button variant="outline" className="w-full h-12 flex items-center justify-center gap-2 text-xs font-semibold">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>PM2 Manager ({cluster.pm2ActiveCount})</span>
              </Button>
            </Link>
            <Link href={`/vps/${cluster.id}/files`}>
              <Button variant="outline" className="w-full h-12 flex items-center justify-center gap-2 text-xs font-semibold">
                <HardDrive className="w-4 h-4 text-slate-700" />
                <span>File Browser</span>
              </Button>
            </Link>
            <Link href={`/vps/${cluster.id}/monitoring`}>
              <Button variant="outline" className="w-full h-12 flex items-center justify-center gap-2 text-xs font-semibold">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Telemetry Graphs</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
