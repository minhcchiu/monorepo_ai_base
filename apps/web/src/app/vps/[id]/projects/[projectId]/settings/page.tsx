'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  fetchProjectDetail,
  updateProjectSettings,
  removeProjectScope,
} from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem } from '@/modules/projects/types';
import { Sliders, AlertTriangle, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<'prod' | 'staging' | 'dev'>('prod');
  const [port, setPort] = useState<number | string>(3000);
  const [domainProxy, setDomainProxy] = useState('');
  const [workingDir, setWorkingDir] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const projData = await fetchProjectDetail(vpsId, projectId);
      setProject(projData);
      setName(projData.name || '');
      setDescription(projData.description || '');
      setEnvironment(projData.environment || 'prod');
      setPort(projData.port || 3000);
      setDomainProxy(projData.domainProxy || '');
      setWorkingDir(projData.workingDir || `/var/www/apps/${projectId}`);
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await updateProjectSettings(vpsId, projectId, {
        name,
        description,
        environment,
        port: Number(port),
        domainProxy,
        workingDir,
      });
      toast.success('Project settings saved successfully');
      await loadData();
    } catch (e) {
      toast.error('Failed to update project settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProject = async () => {
    if (!confirm('Are you sure you want to stop PM2 process and remove this project scope?')) return;
    try {
      setDeleting(true);
      await removeProjectScope(vpsId, projectId);
      toast.success('Project scope removed successfully');
      router.push(`/vps/${vpsId}/projects`);
    } catch (e) {
      toast.error('Failed to remove project');
    } finally {
      setDeleting(false);
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

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-slate-700" />
                <span>General Project Configuration & Settings</span>
              </h2>
              <p className="text-xs text-slate-500">
                Update display name, environment tags, default domain proxy, and working paths.
              </p>
            </div>
            <Button size="sm" disabled={saving} onClick={handleSaveSettings} className="h-8 text-xs gap-1 bg-blue-600">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Settings</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-1.5">
              <Label>Project Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label>Environment Tag</Label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="prod">Production (prod)</option>
                <option value="staging">Staging (staging)</option>
                <option value="dev">Development (dev)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Internal Listening Port</Label>
              <Input value={port} onChange={(e) => setPort(e.target.value)} className="h-9 text-xs font-mono" />
            </div>

            <div className="space-y-1.5">
              <Label>Domain Proxy</Label>
              <Input value={domainProxy} onChange={(e) => setDomainProxy(e.target.value)} className="h-9 text-xs font-mono" />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label>VPS Working Directory</Label>
              <Input value={workingDir} onChange={(e) => setWorkingDir(e.target.value)} className="h-9 text-xs font-mono" />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project notes..." className="h-9 text-xs" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone: Stop process & remove project</span>
              </div>
              <p className="text-[11px] text-slate-500">
                This will delete the PM2 process from the target VPS and remove the project entry from the database.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleRemoveProject}
              className="h-8 text-xs gap-1 shrink-0"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Remove Project Scope</span>
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
