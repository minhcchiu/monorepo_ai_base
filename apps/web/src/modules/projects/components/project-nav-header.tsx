'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Folder,
  Server,
  ChevronRight,
  RotateCw,
  Square,
  Rocket,
  ExternalLink,
  Cpu,
  FileText,
  GitBranch,
  Key,
  Globe,
  Activity,
  HardDrive,
  History,
  Sliders,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProjectItem } from '../types';
import { toast } from 'sonner';
import {
  restartProjectRuntime,
  stopProjectRuntime,
  triggerProjectDeployment,
  fetchProjectDeployments,
} from '../api';

interface ProjectNavHeaderProps {
  project: ProjectItem;
  vpsId: string;
  onRefresh?: () => void;
}

export function ProjectNavHeader({ project, vpsId, onRefresh }: ProjectNavHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const basePath = `/vps/${vpsId}/projects/${project.id}`;

  const tabs = [
    { label: 'Overview', href: basePath, icon: Folder },
    { label: 'Runtime', href: `${basePath}/runtime`, icon: Cpu },
    { label: 'Logs', href: `${basePath}/logs`, icon: FileText },
    { label: 'Deployments', href: `${basePath}/deployments`, icon: Rocket },
    { label: 'Source', href: `${basePath}/source`, icon: GitBranch },
    { label: 'Environment', href: `${basePath}/environment`, icon: Key },
    { label: 'Domains', href: `${basePath}/domains`, icon: Globe },
    { label: 'Nginx', href: `${basePath}/nginx`, icon: ShieldAlert },
    { label: 'Monitoring', href: `${basePath}/monitoring`, icon: Activity },
    { label: 'Storage', href: `${basePath}/storage`, icon: HardDrive },
    { label: 'Activity', href: `${basePath}/activity`, icon: History },
    { label: 'Settings', href: `${basePath}/settings`, icon: Sliders },
  ];

  const [redeployModalOpen, setRedeployModalOpen] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const [redeployLogs, setRedeployLogs] = useState<string>('');
  const [redeployError, setRedeployError] = useState<string | null>(null);
  const [redeploySuccess, setRedeploySuccess] = useState(false);
  const redeployLogsEndRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (redeployLogsEndRef.current) {
      redeployLogsEndRef.current.scrollTop = redeployLogsEndRef.current.scrollHeight;
    }
  }, [redeployLogs]);

  const handleRestart = async () => {
    try {
      setLoadingAction('restart');
      const res = await restartProjectRuntime(vpsId, project.id);
      if (res?.success !== false) {
        toast.success(res?.message || 'PM2 process restart triggered!');
        if (onRefresh) onRefresh();
        else router.refresh();
      } else {
        toast.error(res?.message || 'Failed to restart PM2 process');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error executing restart');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStop = async () => {
    try {
      setLoadingAction('stop');
      const res = await stopProjectRuntime(vpsId, project.id);
      if (res?.success !== false) {
        toast.warning(res?.message || 'Stop command sent to process');
        if (onRefresh) onRefresh();
        else router.refresh();
      } else {
        toast.error(res?.message || 'Failed to stop process');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error executing stop command');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeploy = async () => {
    try {
      setLoadingAction('deploy');
      setRedeployModalOpen(true);
      setRedeploying(true);
      setRedeployError(null);
      setRedeploySuccess(false);
      setRedeployLogs(`🚀 Kích hoạt Re-deploy cho dự án '${project.name}'...\nĐang kết nối SSH đến VPS ${project.hostVpsIp}...\nĐang chuẩn bị git pull origin ${project.gitBranch || 'main'}...`);

      const res = await triggerProjectDeployment(vpsId, project.id, {
        deployMode: 'RE_DEPLOY',
        branch: project.gitBranch || 'main',
        deployDir: project.workingDir || `/home/production-deploys/${project.id}`,
      });

      const targetDepId = res?.id;
      const startTime = Date.now();
      let finalStatus = res?.status || 'RUNNING';
      let currentLogs = res?.logs || 'Đang thực thi script Re-deploy trên VPS...';

      // Connect to Real-time SSE Stream directly from VPS
      let eventSource: EventSource | null = null;
      if (targetDepId) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
          const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
          const sseUrl = `${cleanBaseUrl}/vps/${vpsId}/projects/${project.id}/deployments/${targetDepId}/stream`;

          eventSource = new EventSource(sseUrl);
          eventSource.onmessage = (event) => {
            if (event.data) {
              setRedeployLogs((prev) => prev + event.data);
            }
          };
          eventSource.onerror = () => {
            if (eventSource) eventSource.close();
          };
        } catch (e) {
          // Fallback to polling
        }
      }

      while (finalStatus === 'RUNNING' && Date.now() - startTime < 300000) {
        await new Promise((r) => setTimeout(r, 800));

        setRedeployLogs((logs) => {
          if (logs.includes('=== DEPLOYMENT COMPLETED')) {
            finalStatus = logs.includes('SUCCESS') ? 'SUCCESS' : 'FAILED';
          }
          return logs;
        });

        if (finalStatus !== 'RUNNING') break;

        try {
          const deps = await fetchProjectDeployments(vpsId, project.id);
          if (Array.isArray(deps) && deps.length > 0) {
            const currentDep = deps.find((d: any) => d.id === targetDepId) || deps[0];
            finalStatus = currentDep.status || 'RUNNING';
            if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
              currentLogs = currentDep.logs || currentLogs;
              setRedeployLogs(currentLogs);
            }
          }
        } catch (err) {
          // Keep polling
        }
      }

      if (eventSource) {
        eventSource.close();
      }

      if (finalStatus === 'FAILED' || currentLogs.includes('MODULE_NOT_FOUND')) {
        setRedeployError(currentLogs || 'Lỗi thực thi script Re-deploy trên VPS');
        setRedeploySuccess(false);
        toast.error(`❌ Re-deploy thất bại cho dự án ${project.name}!`);
      } else {
        setRedeploySuccess(true);
        toast.success(`🎉 DỰ ÁN ${project.name} ĐÃ PULL CODE VÀ RE-DEPLOY THÀNH CÔNG!`);
        if (onRefresh) onRefresh();
        else router.refresh();
      }
    } catch (e: any) {
      setRedeployError(e?.response?.data?.message || 'Error starting deployment');
      toast.error('❌ Lỗi kích hoạt Re-deploy');
    } finally {
      setLoadingAction(null);
      setRedeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Context */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-medium">
          <Link href="/vps" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Server className="w-3.5 h-3.5" />
            <span>VPS Instances</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/vps/${vpsId}`} className="hover:text-blue-600 transition-colors">
            {project.hostVpsName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/vps/${vpsId}/projects`} className="hover:text-blue-600 transition-colors">
            Projects
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold">{project.name}</span>
        </div>

        {/* Title Deck & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{project.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full font-semibold text-xs flex items-center gap-1 ${
                project.status === 'running'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  project.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`} />
                <span className="capitalize">{project.status}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-semibold uppercase border border-blue-200/60">
                {project.environment}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-600 border border-slate-200/60 flex items-center gap-1">
                <Server className="w-3 h-3 text-slate-500" />
                <span>{project.hostVpsName} ({project.hostVpsIp})</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">
              Engine: {project.engine} • Port: {project.port} • Domain: {project.domainProxy}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <a href={`https://${project.domainProxy}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>{project.domainProxy}</span>
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              disabled={loadingAction === 'restart'}
              onClick={handleRestart}
              className="h-8 px-3 text-xs gap-1.5"
            >
              {loadingAction === 'restart' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Restart PM2</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loadingAction === 'stop'}
              onClick={handleStop}
              className="h-8 px-3 text-xs gap-1.5"
            >
              {loadingAction === 'stop' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Stop</span>
            </Button>
            <Button
              size="sm"
              disabled={loadingAction === 'deploy'}
              onClick={handleDeploy}
              className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {loadingAction === 'deploy' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Rocket className="w-3.5 h-3.5" />
              )}
              <span>Deploy lại (Git Pull)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const active =
              tab.href === basePath ? pathname === basePath : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Re-deploy Live Progress Dialog */}
      <Dialog open={redeployModalOpen} onOpenChange={setRedeployModalOpen}>
        <DialogContent className="max-w-3xl bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden p-0">
          <DialogHeader className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white space-y-1">
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 text-emerald-400 ${redeploying ? 'animate-spin' : ''}`} />
                <span>Re-Deploy Code Mới — {project.name}</span>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                {project.gitBranch || 'main'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 font-mono">
              Thực thi Git Pull origin {project.gitBranch || 'main'} → pnpm install → pnpm build → PM2 reload trên {project.hostVpsName} ({project.hostVpsIp})
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* 4-Step Visual Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                redeployLogs.includes('STEP 1:') ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase font-mono tracking-wider">Bước 1</div>
                <div className="text-xs flex items-center justify-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Git Pull Code</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                redeployLogs.includes('STEP 3:') ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase font-mono tracking-wider">Bước 2</div>
                <div className="text-xs flex items-center justify-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Install Packages</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                redeployLogs.includes('STEP 4:') ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase font-mono tracking-wider">Bước 3</div>
                <div className="text-xs flex items-center justify-center gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Build App</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-center space-y-1 ${
                redeployLogs.includes('STEP 7:') ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase font-mono tracking-wider">Bước 4</div>
                <div className="text-xs flex items-center justify-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reload PM2</span>
                </div>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-100 space-y-2 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-indigo-400">
                  <Terminal className="w-3.5 h-3.5" />
                  LIVE SSH TERMINAL LOGS
                </span>
                {redeploying && (
                  <span className="text-emerald-400 flex items-center gap-1 animate-pulse font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Đang thực thi Re-deploy...
                  </span>
                )}
              </div>

              <pre
                ref={redeployLogsEndRef}
                className="max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all text-emerald-400 leading-relaxed font-mono pt-1"
              >
                {redeployLogs}
              </pre>
            </div>

            {/* Status Banners */}
            {redeploySuccess && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>🎉 DỰ ÁN ĐÃ PULL CODE VÀ RE-DEPLOY THÀNH CÔNG! PM2 PROCESSES ĐÃ ĐƯỢC RELOAD.</span>
              </div>
            )}

            {redeployError && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>❌ RE-DEPLOY THẤT BẠI: {redeployError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={redeploying}
                onClick={() => setRedeployModalOpen(false)}
                className="h-8 text-xs font-semibold"
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
