'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Server, Cpu, MoreVertical, CloudOff, RefreshCw, Terminal, Sliders, Activity } from 'lucide-react';
import { VpsNode, VpsFilter } from '../types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VpsHealthOverviewProps {
  nodes: VpsNode[];
  onDiagnose?: (nodeId: string) => void;
  isDiagnosing?: boolean;
}

export function VpsHealthOverview({
  nodes,
  onDiagnose,
  isDiagnosing = false,
}: VpsHealthOverviewProps) {
  const [filter, setFilter] = useState<VpsFilter>('all');

  const filteredNodes = nodes.filter((node) => {
    if (filter === 'attention') {
      return node.status === 'warning' || node.status === 'offline';
    }
    return true;
  });

  return (
    <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-slate-900">VPS Health Overview</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-xs text-slate-600 border border-slate-200/60">
            {nodes.length} Tracked
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Instances ({nodes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('attention')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === 'attention'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Attention Needed</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </button>
        </div>
      </div>

      {/* Nodes List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredNodes.map((node) => {
          const statusLower = (node.status || '').toLowerCase();
          const isHealthy = statusLower === 'healthy' || statusLower === 'online';
          const isWarning = statusLower === 'warning' || statusLower === 'degraded';
          const isOffline = statusLower === 'offline' || (!isHealthy && !isWarning);

          return (
            <div
              key={node.id}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100/60 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Left Info Section */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isHealthy
                      ? 'bg-emerald-100 text-emerald-800'
                      : isWarning
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isOffline ? (
                    <CloudOff className="w-5 h-5" />
                  ) : isWarning ? (
                    <Cpu className="w-5 h-5" />
                  ) : (
                    <Server className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">
                      {node.name}
                    </span>

                    {/* Status Badge */}
                    {isHealthy && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{node.statusBadgeText}</span>
                      </span>
                    )}

                    {isWarning && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span>{node.statusBadgeText}</span>
                      </span>
                    )}

                    {isOffline && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Offline</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-200/70 font-mono text-[11px] text-slate-600">
                      {node.region}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-500">
                    <span className="font-mono text-slate-800">{node.ip}</span>
                    <span>•</span>
                    <span>{node.os}</span>
                    {!isOffline && (
                      <>
                        <span>•</span>
                        <span>{node.projectsCount} Projects</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {node.pm2ProcessesCount} PM2 Active
                        </span>
                      </>
                    )}
                    {isOffline && (
                      <>
                        <span>•</span>
                        <span className="text-rose-600 font-medium">
                          {node.alertNote || 'Connection timeout (Heartbeat lost)'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Telemetry / Action Section */}
              {node.telemetryConnected ? (
                <div className="grid grid-cols-3 sm:flex items-center gap-4 lg:gap-6 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
                  {/* CPU */}
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium">CPU</span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        node.cpuPercent >= 85 ? 'text-blue-600' : 'text-slate-900'
                      }`}
                    >
                      {node.cpuPercent}%
                    </span>
                    <div className="w-16 bg-slate-200 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full ${
                          node.cpuPercent >= 85 ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                        style={{ width: `${node.cpuPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM */}
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium">RAM</span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        node.ramPercent >= 85 ? 'text-indigo-600' : 'text-slate-900'
                      }`}
                    >
                      {node.ramPercent}%
                    </span>
                    <div className="w-16 bg-slate-200 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full ${
                          node.ramPercent >= 85 ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        style={{ width: `${node.ramPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Disk */}
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium">Disk</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {node.diskPercent}%
                    </span>
                    <div className="w-16 bg-slate-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-slate-700 h-1 rounded-full"
                        style={{ width: `${node.diskPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-1 flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="VPS actions"
                          className="p-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link href={`/vps/${node.id}`} className="flex items-center cursor-pointer">
                            <Activity className="w-4 h-4 mr-2 text-slate-500" />
                            View Telemetry
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/vps/${node.id}/terminal`} className="flex items-center cursor-pointer">
                            <Terminal className="w-4 h-4 mr-2 text-slate-500" />
                            SSH Terminal
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/vps/${node.id}/settings`} className="flex items-center cursor-pointer">
                            <Sliders className="w-4 h-4 mr-2 text-slate-500" />
                            Node Settings
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
                  <span className="font-mono text-xs text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
                    Telemetry disconnected
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onDiagnose?.(node.id)}
                    disabled={isDiagnosing}
                    className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                    <span>Diagnose Node</span>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
