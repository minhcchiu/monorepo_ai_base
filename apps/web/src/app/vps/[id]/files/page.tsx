'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { fetchVpsFiles } from '@/modules/vps/api';
import { VpsFileItem } from '@/modules/vps/types';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, Folder, FileText, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VpsFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);
  const [files, setFiles] = useState<VpsFileItem[]>([]);

  const loadFiles = useCallback(async () => {
    try {
      const data = await fetchVpsFiles(id);
      setFiles(data);
    } catch (e) {
      //
    }
  }, [id]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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
                <HardDrive className="w-5 h-5 text-slate-700" />
                <span>Remote File Manager</span>
              </h2>
              <p className="text-xs text-slate-500 font-mono">Current path: /var/www/apps</p>
            </div>

            <Button size="sm" onClick={() => toast.success('Upload dialog opened')} className="h-8 text-xs gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Permissions</th>
                  <th className="py-3 px-3">Last Modified</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {file.type === 'directory' ? (
                          <Folder className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-500" />
                        )}
                        <span>{file.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{file.size}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{file.permissions}</td>
                    <td className="py-3 px-3 text-slate-500">{file.lastModified}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.success(`Downloading ${file.name}`)}
                          className="h-7 w-7 text-slate-600"
                        >
                          <Download className="w-3.5 h-3.5" />
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
