'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { fetchVpsBackups } from '@/modules/vps/api';
import { VpsBackupItem } from '@/modules/vps/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VpsBackupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);
  const [backups, setBackups] = useState<VpsBackupItem[]>([]);

  const loadBackups = useCallback(async () => {
    try {
      const data = await fetchVpsBackups(id);
      setBackups(data);
    } catch (e) {
      //
    }
  }, [id]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

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
            <Archive className="w-5 h-5 text-indigo-600" />
            <span>Node Snapshots & Backups</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-3">Filename</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {backups.map((bak) => (
                  <tr key={bak.id}>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">{bak.filename}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 capitalize">{bak.type}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{bak.size}</td>
                    <td className="py-3 px-3 text-slate-500">{bak.createdAt}</td>
                    <td className="py-3 px-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <Download className="w-3.5 h-3.5 mr-1" /> Download
                      </Button>
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
