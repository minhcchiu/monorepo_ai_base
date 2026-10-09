'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchProjectDetail, fetchProjectOverview } from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem } from '@/modules/projects/types';
import {
  GitBranch,
  Globe,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function useUnwrapParams<T>(params: Promise<T> | T): T {
  if (params && typeof (params as any).then === 'function') {
    return use(params as Promise<T>);
  }
  return params as T;
}

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }> | { id: string; projectId: string };
}) {
  const resolvedParams = useUnwrapParams(params);
  const vpsId = resolvedParams?.id || '';
  const projectId = resolvedParams?.projectId || '';
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRepo, setCopiedRepo] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projData, overData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectOverview(vpsId, projectId),
      ]);
      setProject(projData);
      setOverview(overData);
    } catch (e) {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !project) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardShell>
    );
  }

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

  const rawRepoUrl =
    overview?.gitInfo?.repo && overview?.gitInfo?.repo !== 'N/A'
      ? overview.gitInfo.repo
      : proj.gitRepo || '';

  const handleCopyRepo = () => {
    if (!rawRepoUrl || rawRepoUrl === 'N/A') {
      toast.error('Không có URL Git Repository để sao chép');
      return;
    }
    navigator.clipboard.writeText(rawRepoUrl);
    setCopiedRepo(true);
    toast.success('Đã sao chép Git Repository URL!');
    setTimeout(() => setCopiedRepo(false), 2000);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ProjectNavHeader project={proj} vpsId={vpsId} onRefresh={loadData} />

        {/* Spec Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Card 1: Health & Uptime */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Health & Uptime</span>
              <span className={`w-2 h-2 rounded-full ${proj.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight font-mono">
              {overview?.uptime || 'Active'}
            </div>
            <p className="text-xs text-slate-500">Continuous operational state without critical fault</p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">PM2 Process: {proj.pm2Instances}</span>
              <span className={`${proj.status === 'running' ? 'text-emerald-700' : 'text-amber-700'} font-semibold flex items-center gap-1`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {proj.status === 'running' ? 'Active' : 'Stopped'}
              </span>
            </div>
          </div>

          {/* Card 2: Source Control */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Source Control</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRepo}
                  className="h-6 px-2 text-[11px] gap-1 hover:bg-slate-100"
                  title="Sao chép Git Repository URL"
                >
                  {copiedRepo ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
                <GitBranch className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div
              className="text-sm font-semibold text-slate-900 font-mono truncate bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 cursor-pointer hover:border-blue-300 transition-colors flex items-center justify-between gap-2"
              title={`Click để sao chép: ${rawRepoUrl || 'N/A'}`}
              onClick={handleCopyRepo}
            >
              <span className="truncate">{rawRepoUrl || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
                {overview?.gitInfo?.branch || proj.gitBranch}
              </span>
              <span className="text-blue-600 font-medium">#{overview?.gitInfo?.hash || proj.gitHash}</span>
            </div>
            <p className="text-[11px] text-slate-500">Last rollout {proj.lastRolloutAgo || 'recently'}</p>
          </div>

          {/* Card 3: Reverse Proxy & SSL */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Domain Proxy & SSL</span>
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-base font-semibold text-slate-900 font-mono truncate">
              https://{proj.domainProxy}
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSL Valid ({overview?.ssl?.daysRemaining || 90} days)
              </span>
              <span className="text-slate-500">Proxy Port: {proj.port}</span>
            </div>
            <p className="text-[11px] text-slate-500">Nginx reverse proxy active</p>
          </div>
        </div>

        {/* Live Resource Footprint */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Application Process Utilization</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-xs text-slate-500 font-medium">CPU Usage</div>
              <div className="text-xl font-semibold font-mono text-blue-600">{proj.cpuPercent}%</div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(proj.cpuPercent, 100)}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Memory Footprint</div>
              <div className="text-xl font-semibold font-mono text-indigo-600">{proj.memoryMb} MB</div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min((proj.memoryMb / 512) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Restarts</div>
              <div className="text-xl font-semibold font-mono text-slate-900">
                {overview?.restartsCount ?? 0} times
              </div>
              <p className="text-[11px] text-slate-500">PM2 process restart counter</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Cluster Workers</div>
              <div className="text-xl font-semibold font-mono text-emerald-700">{proj.pm2Instances}</div>
              <p className="text-[11px] text-slate-500">PM2 execution mode</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
