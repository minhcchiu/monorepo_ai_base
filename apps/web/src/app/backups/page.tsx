'use client';

import { DashboardShell } from '@/components/common/dashboard-shell';
import { Archive, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalBackupsPage() {
  const backups = [
    { id: '1', filename: 'calo_db_dump_20261005.sql.gz', node: 'Production API Cluster 01', type: 'Database', size: '482.5 MB', time: 'Today, 02:00 AM' },
    { id: '2', filename: 'vps_snapshot_cluster_01.tar.zst', node: 'Staging Gateway HCM', type: 'Snapshot', size: '1.8 GB', time: '3 days ago' },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Global Backups & Snapshots</h1>
            <p className="text-sm text-slate-500">
              Automated PostgreSQL database dumps, filesystem snapshots, and config archives.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                <th className="py-3 px-4">Archive Filename</th>
                <th className="py-3 px-4">VPS Node</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{b.filename}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-600">{b.node}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-500">{b.type}</td>
                  <td className="py-3.5 px-4 text-slate-700">{b.size}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-sans">{b.time}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-sans">
                      <Download className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
