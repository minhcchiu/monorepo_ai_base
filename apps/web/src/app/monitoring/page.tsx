'use client';

import { DashboardShell } from '@/components/common/dashboard-shell';
import { Activity } from 'lucide-react';

export default function GlobalMonitoringPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Global Telemetry Monitoring</h1>
            <p className="text-sm text-slate-500">
              Aggregated CPU, RAM, Disk, and Network I/O metrics streaming in real-time across all 12 VPS nodes.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Fleet Utilization Heatmap</span>
          </h2>
          <div className="h-64 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 text-xs font-mono">
            [ Live Grafana Telemetry Stream Widget ]
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
