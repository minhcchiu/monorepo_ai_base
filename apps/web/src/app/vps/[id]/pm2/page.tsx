'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { fetchVpsPm2, reloadVpsPm2, restartVpsPm2 } from '@/modules/vps/api';
import { Pm2ProcessItem } from '@/modules/vps/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, RotateCw, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VpsPm2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);
  const [processes, setProcesses] = useState<Pm2ProcessItem[]>([]);
  const [reloading, setReloading] = useState(false);
  const [restartingName, setRestartingName] = useState<string | null>(null);

  const loadPm2 = useCallback(async () => {
    try {
      const data = await fetchVpsPm2(id);
      setProcesses(data);
    } catch (e) {
      //
    }
  }, [id]);

  useEffect(() => {
    loadPm2();
  }, [loadPm2]);

  const handleReloadAll = async () => {
    try {
      setReloading(true);
      const res = await reloadVpsPm2(id);
      toast.success(res?.message || 'PM2 processes reloaded!');
      await loadPm2();
    } catch (e) {
      toast.error('Failed to reload PM2 processes');
    } finally {
      setReloading(false);
    }
  };

  const handleRestartOne = async (procName: string) => {
    try {
      setRestartingName(procName);
      const res = await restartVpsPm2(id, procName);
      toast.success(res?.message || `Restarted ${procName}`);
      await loadPm2();
    } catch (e) {
      toast.error(`Failed to restart ${procName}`);
    } finally {
      setRestartingName(null);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <span>PM2 Process Runtime Manager</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live inspect Node.js microservices, cluster instances, restart counts, and memory footprints.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={reloading}
                onClick={handleReloadAll}
                className="h-8 px-3 text-xs gap-1.5"
              >
                {reloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                <span>Reload All PM2</span>
              </Button>
            </div>
          </div>

          {/* PM2 Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-3">ID / App Name</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Restarts</th>
                  <th className="py-3 px-3">CPU</th>
                  <th className="py-3 px-3">Memory</th>
                  <th className="py-3 px-3">Uptime</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {processes.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">#{proc.id}</span>
                        <span>{proc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60">
                        {proc.mode}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{proc.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{proc.restarts}</td>
                    <td className="py-3 px-3 font-mono font-medium text-blue-600">{proc.cpuPercent}%</td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-900">{proc.memoryMb} MB</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{proc.uptime}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={restartingName === proc.name}
                          onClick={() => handleRestartOne(proc.name)}
                          className="h-7 w-7 text-slate-600 hover:text-blue-600"
                        >
                          {restartingName === proc.name ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
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
