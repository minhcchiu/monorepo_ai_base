'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectItem } from '../types';
import { toast } from 'sonner';
import {
  restartProjectRuntime,
  stopProjectRuntime,
  triggerProjectDeployment,
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
      const res = await triggerProjectDeployment(vpsId, project.id, 'User Trigger');
      if (res) {
        toast.success(`Deployment build ${res.buildNumber || '#211'} started!`);
        if (onRefresh) onRefresh();
        else router.refresh();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error starting deployment');
    } finally {
      setLoadingAction(null);
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
              className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {loadingAction === 'deploy' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Rocket className="w-3.5 h-3.5" />
              )}
              <span>Deploy Now</span>
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
    </div>
  );
}
