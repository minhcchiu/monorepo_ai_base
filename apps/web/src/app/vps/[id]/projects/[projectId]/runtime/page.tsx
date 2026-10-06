'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  fetchProjectDetail,
  fetchProjectRuntime,
  restartProjectRuntime,
  stopProjectRuntime,
  startProjectRuntime,
  updateProjectRuntimeApi,
} from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { PortManagerCard } from '@/modules/projects/components/port-manager-card';
import { ProjectItem } from '@/modules/projects/types';
import { Cpu, RotateCw, Square, Play, Save, Loader2, Server, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProjectRuntimePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [runtime, setRuntime] = useState<any>(null);

  // Editable Runtime Form State
  const [engine, setEngine] = useState('Node.js 20 / PM2');
  const [execMode, setExecMode] = useState<'cluster' | 'fork'>('cluster');
  const [instances, setInstances] = useState<number | string>(4);
  const [entryPoint, setEntryPoint] = useState('dist/main.js');

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [projData, runData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectRuntime(vpsId, projectId),
      ]);
      setProject(projData);
      setRuntime(runData);

      if (projData) {
        setEngine(projData.engine || 'Node.js 20 / PM2');
        setInstances(projData.pm2Instances?.includes('workers') ? parseInt(projData.pm2Instances) : 4);
      }
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRestart = async () => {
    try {
      setLoadingAction('restart');
      const res = await restartProjectRuntime(vpsId, projectId);
      toast.success(res?.message || 'Restarted PM2 process');
      await loadData();
    } catch (e: any) {
      toast.error('Failed to restart process');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStop = async () => {
    try {
      setLoadingAction('stop');
      const res = await stopProjectRuntime(vpsId, projectId);
      toast.warning(res?.message || 'Stopped process');
      await loadData();
    } catch (e: any) {
      toast.error('Failed to stop process');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStart = async () => {
    try {
      setLoadingAction('start');
      const res = await startProjectRuntime(vpsId, projectId);
      toast.success(res?.message || 'Started process');
      await loadData();
    } catch (e: any) {
      toast.error('Failed to start process');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveRuntime = async () => {
    try {
      setLoadingAction('save');
      await updateProjectRuntimeApi(vpsId, projectId, {
        engine,
        execMode,
        instances: Number(instances),
        entryPoint,
      });
      toast.success('Runtime configuration saved!');
      await loadData();
    } catch (e) {
      toast.error('Failed to update runtime configuration');
    } finally {
      setLoadingAction(null);
    }
  };

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
    cpuPercent: 0,
    memoryMb: 0,
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ProjectNavHeader project={proj} vpsId={vpsId} onRefresh={loadData} />

        {/* Process Live KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="text-slate-500 font-sans font-medium">Status</div>
            <div className="text-emerald-700 font-bold text-sm uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{runtime?.status || 'ONLINE'}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="text-slate-500 font-sans font-medium">PID & Port</div>
            <div className="text-slate-900 font-bold text-sm">
              PID {runtime?.pid || 1842} • Port {proj.port}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="text-slate-500 font-sans font-medium">Memory Usage</div>
            <div className="text-indigo-600 font-bold text-sm">{proj.memoryMb} MB</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="text-slate-500 font-sans font-medium">CPU Load</div>
            <div className="text-blue-600 font-bold text-sm">{proj.cpuPercent}%</div>
          </div>
        </div>

        {/* Centralized Port Manager Card */}
        <PortManagerCard vpsId={vpsId} projectId={projectId} onPortsUpdated={loadData} />

        {/* Main Controls & Runtime Config Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <span>Runtime Environment & PM2 Process Configuration</span>
              </h2>
              <p className="text-xs text-slate-500">
                Configure runtime engine, process execution mode, and lifecycle control.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loadingAction === 'start'}
                onClick={handleStart}
                className="h-8 text-xs gap-1 text-emerald-700 hover:bg-emerald-50"
              >
                {loadingAction === 'start' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Start</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={loadingAction === 'stop'}
                onClick={handleStop}
                className="h-8 text-xs gap-1 text-rose-700 hover:bg-rose-50"
              >
                {loadingAction === 'stop' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                <span>Stop</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={loadingAction === 'restart'}
                onClick={handleRestart}
                className="h-8 text-xs gap-1"
              >
                {loadingAction === 'restart' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <RotateCw className="w-3.5 h-3.5 text-blue-600" />}
                <span>Restart PM2</span>
              </Button>

              <Button
                size="sm"
                disabled={loadingAction === 'save'}
                onClick={handleSaveRuntime}
                className="h-8 text-xs gap-1 bg-blue-600"
              >
                {loadingAction === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Runtime</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Runtime Environment Engine</Label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Node.js 20 / PM2">Node.js 20 / PM2</option>
                  <option value="Node.js 18 / PM2">Node.js 18 / PM2</option>
                  <option value="Python 3.11 / FastAPI">Python 3.11 / FastAPI (Uvicorn)</option>
                  <option value="Python 3.10 / Django">Python 3.10 / Django (Gunicorn)</option>
                  <option value="Docker Container">Docker Container</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Main Entry Point Script</Label>
                <Input
                  value={entryPoint}
                  onChange={(e) => setEntryPoint(e.target.value)}
                  placeholder="dist/main.js or app.py"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Execution Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExecMode('cluster')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      execMode === 'cluster'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cluster Mode (Workers)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecMode('fork')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      execMode === 'fork'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Fork Mode (Single)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Worker Instances Count</Label>
                <Input
                  type="number"
                  value={instances}
                  onChange={(e) => setInstances(e.target.value)}
                  min={1}
                  max={32}
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Set to max or number of CPU cores for load balancing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
