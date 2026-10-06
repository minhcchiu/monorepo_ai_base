'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { fetchVpsCrons } from '@/modules/vps/api';
import { VpsCronItem } from '@/modules/vps/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';

export default function VpsCronPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);
  const [crons, setCrons] = useState<VpsCronItem[]>([]);

  const loadCrons = useCallback(async () => {
    try {
      const data = await fetchVpsCrons(id);
      setCrons(data);
    } catch (e) {
      //
    }
  }, [id]);

  useEffect(() => {
    loadCrons();
  }, [loadCrons]);

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
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Crontab Scheduled Jobs</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-3">Schedule</th>
                  <th className="py-3 px-3">Command</th>
                  <th className="py-3 px-3">Comment</th>
                  <th className="py-3 px-3">Last Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {crons.map((cron) => (
                  <tr key={cron.id}>
                    <td className="py-3 px-3 text-blue-600 font-semibold">{cron.schedule}</td>
                    <td className="py-3 px-3 text-slate-800">{cron.command}</td>
                    <td className="py-3 px-3 font-sans text-slate-500">{cron.comment}</td>
                    <td className="py-3 px-3 font-sans text-slate-400">{cron.lastRunAgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
