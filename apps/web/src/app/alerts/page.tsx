'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchInfrastructureOverview } from '@/modules/infrastructure/api';

export default function GlobalAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchInfrastructureOverview().then((data) => {
      if (data?.alerts && data.alerts.length > 0) {
        setAlerts(data.alerts);
      }
    });
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Global Alerts & Incident Monitor</h1>
            <p className="text-sm text-slate-500">
              Active incidents, high resource load alerts, process crashes, and automated resolution rules.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alt) => (
            <div key={alt.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-start gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  alt.severity === 'critical' ? 'bg-rose-500' : alt.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-900">{alt.title}</div>
                <p className="text-xs text-slate-500">{alt.message}</p>
                <div className="mt-1 font-mono text-[11px] text-slate-400">Node: {alt.node} • {alt.timeAgo || 'Recently'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
