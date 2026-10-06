'use client';

import { Server, AlertTriangle, AlertCircle } from 'lucide-react';
import { InfrastructureSummary } from '../types';

interface KpiSummaryCardsProps {
  summary: InfrastructureSummary;
}

export function KpiSummaryCards({ summary }: KpiSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Total VPS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Total VPS</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Server className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-semibold text-slate-900 tracking-tight">
            {summary.totalVps}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>{summary.activeClustersText}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Online & Healthy */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Online & Healthy</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{summary.onlineHealthyPercent}%</span>
          </span>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-semibold text-emerald-600 tracking-tight">
            {summary.onlineHealthyCount}{' '}
            <span className="text-base text-slate-500 font-normal">Nodes</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{summary.latencyText}</p>
        </div>
      </div>

      {/* Card 3: High Load Warning */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">High Load Warning</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Alert</span>
          </span>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-semibold text-slate-900 tracking-tight">
            {summary.highLoadWarningCount}{' '}
            <span className="text-base text-slate-500 font-normal">Nodes</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{summary.highLoadText}</p>
        </div>
      </div>

      {/* Card 4: Offline Nodes */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Offline Nodes</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Action req.</span>
          </span>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-semibold text-rose-600 tracking-tight">
            {summary.offlineNodesCount}{' '}
            <span className="text-base text-slate-500 font-normal">Node</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{summary.offlineText}</p>
        </div>
      </div>
    </div>
  );
}
