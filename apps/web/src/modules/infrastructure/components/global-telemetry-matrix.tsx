'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { GlobalTelemetry } from '../types';

interface GlobalTelemetryMatrixProps {
  telemetry: GlobalTelemetry;
}

export function GlobalTelemetryMatrix({ telemetry }: GlobalTelemetryMatrixProps) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
      {/* Matrix Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Global Telemetry Matrix</h2>
          <p className="text-xs text-slate-500">
            Consolidated resource utilization averaged across all 12 operational host nodes
          </p>
        </div>
        <span className="text-xs text-emerald-700 font-mono flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Sync active (interval: {telemetry.syncIntervalSec}s)
        </span>
      </div>

      {/* Grid of 4 Telemetry Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
        {/* Item 1: CPU Aggregate */}
        <div className="bg-slate-50/80 border border-slate-200/60 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">CPU Aggregate</span>
            <span className="font-mono text-sm font-semibold text-slate-900">
              {telemetry.cpuAggregatePercent}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${telemetry.cpuAggregatePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="font-mono text-[11px] text-slate-500">
              Peak: {telemetry.cpuPeakNode} ({telemetry.cpuPeakPercent}%)
            </span>
            <svg className="w-14 h-4 text-blue-600 overflow-visible" fill="none" viewBox="0 0 50 14">
              <path
                d="M 0 10 Q 12 13 22 7 T 38 12 T 50 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        {/* Item 2: Memory Allocation */}
        <div className="bg-slate-50/80 border border-slate-200/60 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Memory Allocation</span>
            <span className="font-mono text-sm font-semibold text-slate-900">
              {telemetry.memoryAllocationPercent}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${telemetry.memoryAllocationPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 font-mono text-[11px]">
            <span className="text-slate-500">Used: {telemetry.memoryUsedGb} GB</span>
            <span className="text-slate-900">
              Avail: {telemetry.memoryAvailGb} / {telemetry.memoryTotalGb} GB
            </span>
          </div>
        </div>

        {/* Item 3: Storage Pool */}
        <div className="bg-slate-50/80 border border-slate-200/60 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Storage Pool</span>
            <span className="font-mono text-sm font-semibold text-slate-900">
              {telemetry.storagePoolPercent}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-slate-700 h-2 rounded-full transition-all duration-500"
              style={{ width: `${telemetry.storagePoolPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 font-mono text-[11px]">
            <span className="text-slate-500">Used: {telemetry.storageUsedTb} TB</span>
            <span className="text-slate-900">Capacity: {telemetry.storageTotalTb} TB</span>
          </div>
        </div>

        {/* Item 4: Network Bandwidth */}
        <div className="bg-slate-50/80 border border-slate-200/60 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Network Bandwidth</span>
            <span className="font-mono text-sm font-semibold text-slate-900">
              {telemetry.bandwidthMbps} Mbps
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-2 flex-1 rounded-full bg-emerald-100 overflow-hidden">
              <div className="bg-emerald-600 h-2 w-3/5" />
            </div>
            <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
              <div className="bg-slate-600 h-2 w-2/5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 font-mono text-[11px] text-slate-600">
            <span className="flex items-center gap-0.5 text-emerald-700">
              <ArrowDown className="w-3 h-3" />
              {telemetry.bandwidthInMbps.toFixed(1)} In
            </span>
            <span className="flex items-center gap-0.5 text-slate-600">
              <ArrowUp className="w-3 h-3" />
              {telemetry.bandwidthOutMbps.toFixed(1)} Out
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
