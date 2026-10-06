'use client';

import { use } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket } from 'lucide-react';

export default function VpsDeploymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            <span>Cluster Deployment Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500">
            Build triggers, git commit hashes, and rollback history for this server.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
