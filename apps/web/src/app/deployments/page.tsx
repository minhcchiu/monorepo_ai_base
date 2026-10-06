'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchInfrastructureOverview } from '@/modules/infrastructure/api';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export default function GlobalDeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);

  useEffect(() => {
    fetchInfrastructureOverview().then((data) => {
      if (data?.deployments && data.deployments.length > 0) {
        setDeployments(data.deployments);
      }
    });
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Global Deployments</h1>
            <p className="text-sm text-slate-500">
              CI/CD pipeline runs, automated rollouts, git commit hashes, and rollback history across all servers.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Target Host VPS</th>
                <th className="py-3 px-4">Build #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {deployments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">{d.name}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-600">{d.target}</td>
                  <td className="py-3.5 px-4 text-blue-600 font-semibold">{d.buildNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 w-fit font-sans capitalize">
                      {d.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {d.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                      {d.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      <span>{d.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-sans">{d.timeAgo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
