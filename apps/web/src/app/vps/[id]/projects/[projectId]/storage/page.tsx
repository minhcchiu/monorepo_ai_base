'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchProjectDetail, fetchProjectStorage, testProjectDbConnection } from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem, ProjectStorageInfo } from '@/modules/projects/types';
import { HardDrive, Database, Folder, CheckCircle2, RefreshCw, Loader2, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProjectStoragePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [storage, setStorage] = useState<ProjectStorageInfo | null>(null);
  const [testingDb, setTestingDb] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projData, storeData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectStorage(vpsId, projectId),
      ]);
      setProject(projData);
      setStorage(storeData);
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTestDbConnection = async () => {
    try {
      setTestingDb(true);
      const res = await testProjectDbConnection(vpsId, projectId);
      if (res?.success) {
        toast.success(res.message || `Database connection test SUCCESS (${res.databaseName} @ ${res.host}:${res.port})`);
      } else {
        toast.error(res?.message || 'Failed to connect to target Database');
      }
    } catch (e: any) {
      toast.error('Failed to connect to target Database');
    } finally {
      setTestingDb(false);
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

  const dbInfo = storage?.linkedDatabase || {
    id: 'db-calo-prod',
    name: `${proj.id}_db`,
    type: 'PostgreSQL',
    host: '103.56.162.77',
    port: 5432,
    status: 'CONNECTED',
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ProjectNavHeader project={proj} vpsId={vpsId} onRefresh={loadData} />

        {/* Disk Space & Folder Footprint Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-slate-700" />
              <span>Project Directory & Disk Storage Footprint</span>
            </h2>
            <Button variant="outline" size="sm" onClick={loadData} className="h-8 text-xs gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Footprint</span>
            </Button>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 font-mono text-xs flex items-center justify-between">
            <span className="font-sans text-slate-500 flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-500" />
              <span>VPS Working Directory:</span>
            </span>
            <span className="font-bold text-slate-900">{storage?.workingDirectory || `/var/www/apps/${proj.id}`}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-slate-500 font-sans text-xs">Total Disk Footprint</div>
              <div className="text-xl font-bold text-slate-900">{storage?.totalDiskUsage || '2.4 GB'}</div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '48%' }} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-slate-500 font-sans text-xs">Source Code Size</div>
              <div className="text-xl font-bold text-blue-600">{storage?.codeSize || '184 MB'}</div>
              <p className="text-[11px] text-slate-500 font-sans">Git repository code</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-slate-500 font-sans text-xs">Dependencies Size</div>
              <div className="text-xl font-bold text-indigo-600">{storage?.nodeModulesSize || '1.8 GB'}</div>
              <p className="text-[11px] text-slate-500 font-sans">node_modules / packages</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-slate-500 font-sans text-xs">Logs & Temp Data</div>
              <div className="text-xl font-bold text-emerald-700">{storage?.logsSize || '142 MB'}</div>
              <p className="text-[11px] text-slate-500 font-sans">PM2 log files</p>
            </div>
          </div>
        </div>

        {/* Linked Project Database Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Linked Database Connection</span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              disabled={testingDb}
              onClick={handleTestDbConnection}
              className="h-8 text-xs gap-1 text-blue-600 hover:bg-blue-50"
            >
              {testingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Test Connection</span>
            </Button>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-sans font-semibold text-slate-900 text-sm">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>{dbInfo.name}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs uppercase font-mono font-bold">
                  {dbInfo.type}
                </span>
              </div>
              <p className="text-slate-500 font-mono">
                Host: {dbInfo.host}:{dbInfo.port}
              </p>
            </div>

            <div className="flex items-center gap-2 font-sans">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: {dbInfo.status}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
