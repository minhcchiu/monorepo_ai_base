'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { fetchVpsLogs } from '@/modules/vps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VpsLogsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchVpsLogs(id);
      setLogs(data);
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

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

        <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold">Live System & Application Logs for {cluster.name}</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={loadLogs}
              className="h-7 text-xs text-slate-300 gap-1 bg-slate-900 border-slate-800 hover:bg-slate-800"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Refresh Log Stream</span>
            </Button>
          </div>

          <div className="font-mono text-xs text-slate-300 space-y-1.5 h-96 overflow-y-auto select-text">
            {logs.map((line, idx) => (
              <p
                key={idx}
                className={
                  line.includes('WARN')
                    ? 'text-amber-400'
                    : line.includes('ERROR')
                    ? 'text-rose-400'
                    : 'text-blue-400'
                }
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
