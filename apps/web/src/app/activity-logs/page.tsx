'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchInfrastructureOverview } from '@/modules/infrastructure/api';
import { Key } from 'lucide-react';

export default function GlobalActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchInfrastructureOverview().then((data) => {
      if (data?.activity && data.activity.length > 0) {
        setLogs(data.activity);
      }
    });
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Global Audit Stream & Activity Logs</h1>
            <p className="text-sm text-slate-500">
              Immutable event stream recording user logins, deployments, daemon restarts, and system config modifications.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs flex items-center justify-center shrink-0">
                {log.userName === 'System Audit' || log.userName === 'System Admin' ? (
                  <Key className="w-4 h-4" />
                ) : (
                  (log.userName || 'SA').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className="text-slate-900 font-medium">
                  <span className="font-semibold">{log.userName || 'System Admin'}</span> {log.actionText}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400">{log.detailText} • {log.timeAgo}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
