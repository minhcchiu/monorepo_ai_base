'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  useInfrastructureOverview,
  useDiagnoseVpsNode,
} from '@/modules/infrastructure/hooks/use-infrastructure';
import { InfrastructureHeader } from '@/modules/infrastructure/components/infrastructure-header';
import { KpiSummaryCards } from '@/modules/infrastructure/components/kpi-summary-cards';
import { GlobalTelemetryMatrix } from '@/modules/infrastructure/components/global-telemetry-matrix';
import { VpsHealthOverview } from '@/modules/infrastructure/components/vps-health-overview';
import { RecentDeployments } from '@/modules/infrastructure/components/recent-deployments';
import { RecentAlerts } from '@/modules/infrastructure/components/recent-alerts';
import { RecentActivity } from '@/modules/infrastructure/components/recent-activity';
import { AddVpsDialog } from '@/modules/infrastructure/components/add-vps-dialog';
import { Skeleton } from '@/components/ui/skeleton';

function InfrastructureDashboardContent() {
  const { data, isLoading } = useInfrastructureOverview();
  const diagnoseMutation = useDiagnoseVpsNode();
  const [addVpsOpen, setAddVpsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-[1440px] mx-auto">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const filteredVpsList = data.vpsList.filter((node) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      node.name.toLowerCase().includes(term) ||
      node.ip.toLowerCase().includes(term) ||
      node.region.toLowerCase().includes(term) ||
      node.os.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
      {/* Infrastructure Header */}
      <InfrastructureHeader
        onAddVpsClick={() => setAddVpsOpen(true)}
        searchTerm={searchFilter}
        onSearchChange={setSearchFilter}
      />

      {/* KPI Summary Cards */}
      <KpiSummaryCards summary={data.summary} />

      {/* Global Telemetry Matrix */}
      <GlobalTelemetryMatrix telemetry={data.telemetry} />

      {/* VPS Health Overview List */}
      <VpsHealthOverview
        nodes={filteredVpsList}
        onDiagnose={(nodeId) => diagnoseMutation.mutate(nodeId)}
        isDiagnosing={diagnoseMutation.isPending}
      />

      {/* Lower Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentDeployments deployments={data.deployments} />
        <RecentAlerts alerts={data.alerts} />
        <RecentActivity activities={data.activity} />
      </div>

      {/* Add VPS Dialog */}
      <AddVpsDialog open={addVpsOpen} onOpenChange={setAddVpsOpen} />
    </div>
  );
}

export default function Home() {
  return (
    <DashboardShell>
      <InfrastructureDashboardContent />
    </DashboardShell>
  );
}
