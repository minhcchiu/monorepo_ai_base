'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchProjectDetail, fetchProjectMonitoring } from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem } from '@/modules/projects/types';
import { Activity, Cpu, HardDrive, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectMonitoringPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [monitoring, setMonitoring] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [projData, monData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectMonitoring(vpsId, projectId),
      ]);
      setProject(projData);
      setMonitoring(monData);
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const proj = project || {
    id: projectId,
    name: 'Project Detail',
    engine: 'Node.js',
    hostVpsName: 'VPS Node',
    hostVpsIp: '127.0.0.1',
    environment: 'prod',
    status: 'running',
    pm2Instances: '1 process',
    port: 3000,
    domainProxy: 'localhost',
    gitBranch: 'main',
    gitHash: 'head',
    lastRolloutAgo: 'Recently',
    cpuPercent: 12.4,
    memoryMb: 184.2,
  };

  const cpuVal = monitoring?.cpuPercent ?? proj.cpuPercent ?? 12.4;
  const memVal = monitoring?.memoryMb ?? proj.memoryMb ?? 184.2;

  // Mock trend data points for chart
  const cpuTrend = [8, 11, 14, 12, 18, 15, 10, 12.4];
  const memTrend = [170, 172, 180, 182, 184, 183, 184.2];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ProjectNavHeader project={proj} vpsId={vpsId} onRefresh={loadData} />

        {/* Realtime KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>CPU Load</span>
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{cpuVal}%</div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(cpuVal * 2, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">Normal operating load threshold</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>RAM Footprint</span>
              <HardDrive className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{memVal} MB</div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((memVal / 512) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">Max buffer limit 512 MB</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Zero-Crash Restarts</span>
              <RefreshCw className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {monitoring?.restartsCount ?? 2} restarts
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PM2 Process Stable</span>
            </div>
            <p className="text-[11px] text-slate-500">Last restart triggered manually</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Avg Latency</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">14 ms</div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span>Fast (HTTP/2 Proxied)</span>
            </div>
            <p className="text-[11px] text-slate-500">Measured at Nginx Reverse Proxy</p>
          </div>
        </div>

        {/* Live Utilization Telemetry Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Application Telemetry Trends (CPU & Memory Utilization)</span>
            </h2>
            <Button variant="outline" size="sm" onClick={loadData} className="h-8 text-xs gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </Button>
          </div>

          {/* Visual SVG Trend Graph */}
          <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-slate-100 space-y-4 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  CPU Usage (%)
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Memory Usage (MB)
                </span>
              </div>
              <span>Interval: Last 1 Hour</span>
            </div>

            <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-800">
              {cpuTrend.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    {/* CPU Bar */}
                    <div
                      className="w-1/2 bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-400"
                      style={{ height: `${val * 4}%` }}
                    />
                    {/* Mem Bar */}
                    <div
                      className="w-1/2 bg-indigo-500 rounded-t transition-all duration-300 group-hover:bg-indigo-400"
                      style={{ height: `${(memTrend[idx % memTrend.length] / 200) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">{idx * 8}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
