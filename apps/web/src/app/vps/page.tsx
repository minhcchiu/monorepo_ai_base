'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Terminal,
  Activity,
  Sliders,
  CloudOff,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsList } from '@/modules/vps/hooks/use-vps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function VpsListPage() {
  const { data: vpsList, isLoading } = useVpsList();
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState<string>('all');

  if (isLoading || !vpsList) {
    return (
      <DashboardShell>
        <div className="space-y-6 max-w-[1440px] mx-auto">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const filteredNodes = vpsList.filter((vps) => {
    const matchesSearch =
      !searchTerm.trim() ||
      vps.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vps.ip.includes(searchTerm) ||
      vps.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnv = envFilter === 'all' || vps.environment === envFilter;
    return matchesSearch && matchesEnv;
  });

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        {/* Tier 1 Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-xs text-blue-600 font-semibold">
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200/60 uppercase">
                Tier 1 • Global Infrastructure
              </span>
              <span>•</span>
              <span className="text-slate-500 font-normal">Live Heartbeat 10s</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">VPS Instances</h1>
            <p className="text-sm text-slate-500">
              Manage, monitor, and connect to all dedicated and cloud VPS servers across distributed edge zones.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/vps/add">
              <Button className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add New VPS</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sort */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by VPS name, IP address, region, or OS..."
              className="h-9 pl-9 pr-10 text-xs"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Environments ({vpsList.length})</option>
              <option value="prod">Production</option>
              <option value="staging">Staging</option>
              <option value="dev">Development</option>
            </select>
          </div>
        </div>

        {/* VPS Fleet Cards List */}
        <div className="space-y-3">
          {filteredNodes.map((vps) => {
            const isHealthy = vps.status === 'healthy';
            const isWarning = vps.status === 'warning';
            const isOffline = vps.status === 'offline';

            return (
              <div
                key={vps.id}
                className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left Server Title & Badges */}
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
                    {isOffline ? <CloudOff className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <Link
                        href={`/vps/${vps.id}`}
                        className="font-semibold text-sm text-slate-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {vps.name}
                      </Link>

                      {isHealthy && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{vps.statusBadgeText}</span>
                        </span>
                      )}

                      {isWarning && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <span>{vps.statusBadgeText}</span>
                        </span>
                      )}

                      {isOffline && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Offline</span>
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-600 border border-slate-200/60">
                        {vps.regionCode}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-500">
                      <span className="font-mono text-slate-800 font-medium">{vps.ip}</span>
                      <span>•</span>
                      <span>{vps.os}</span>
                      {!isOffline && (
                        <>
                          <span>•</span>
                          <span>{vps.projectsCount} Projects</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            {vps.pm2ActiveCount} PM2 Active
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Telemetry & Actions */}
                {!isOffline ? (
                  <div className="grid grid-cols-3 sm:flex items-center gap-4 lg:gap-6 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-medium">CPU</span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {vps.cpuPercent}%
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${vps.cpuPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-medium">RAM</span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {vps.ramPercent}%
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1 mt-1">
                        <div
                          className="bg-indigo-600 h-1 rounded-full"
                          style={{ width: `${vps.ramPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-medium">Disk</span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {vps.diskPercent}%
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1 mt-1">
                        <div
                          className="bg-slate-700 h-1 rounded-full"
                          style={{ width: `${vps.diskPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1.5">
                      <Link href={`/vps/${vps.id}/terminal`}>
                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                          <Terminal className="w-3.5 h-3.5 text-slate-600" />
                          <span>Shell</span>
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/vps/${vps.id}`} className="cursor-pointer">
                              <Activity className="w-4 h-4 mr-2 text-slate-500" />
                              View Overview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/vps/${vps.id}/pm2`} className="cursor-pointer">
                              <Cpu className="w-4 h-4 mr-2 text-slate-500" />
                              PM2 Processes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/vps/${vps.id}/files`} className="cursor-pointer">
                              <HardDrive className="w-4 h-4 mr-2 text-slate-500" />
                              File Manager
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      Disconnected
                    </span>
                    <Link href={`/vps/${vps.id}`}>
                      <Button size="sm" className="h-8 px-3 text-xs">
                        Inspect Node
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
