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
import { Sliders, AlertTriangle, Save, Loader2, Trash2, Cpu, GitBranch, Globe, Server, Copy, Check, Terminal } from 'lucide-react';
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

  // General Specs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<'prod' | 'staging' | 'dev'>('prod');

  // Runtime Specs
  const [pm2Name, setPm2Name] = useState('');
  const [engine, setEngine] = useState('Node.js 20 / PM2');
  const [pm2Instances, setPm2Instances] = useState('1 process');
  const [port, setPort] = useState<number | string>(3000);

  // Network & Directory Specs
  const [domainProxy, setDomainProxy] = useState('');
  const [workingDir, setWorkingDir] = useState('');

  // Git Specs
  const [gitRepo, setGitRepo] = useState('');
  const [gitBranch, setGitBranch] = useState('main');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

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
      setPm2Name(projData.pm2Name || projectId);
      setEngine(projData.engine || 'Node.js 20 / PM2');
      setPm2Instances(projData.pm2Instances || '1 process');
      setGitRepo(projData.gitRepo || '');
      setGitBranch(projData.gitBranch || 'main');
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
        engine,
        pm2Name,
        pm2Instances,
        gitRepo,
        gitBranch,
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
    if (!confirm(`Xác nhận ngắt PM2 và xóa dự án '${name || projectId}' khỏi hệ thống?`)) return;
    try {
      setDeleting(true);
      await removeProjectScope(vpsId, projectId);
      toast.success('Dự án đã được ngắt PM2 và xóa thành công!');
      router.push(`/vps/${vpsId}/projects`);
    } catch (e) {
      toast.error('Lỗi khi xóa dự án');
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

  const webhookUrl = `http://${proj.hostVpsIp}:42090/api/v1/vps/${vpsId}/projects/${projectId}/webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success('Copied Git Auto-Deploy Webhook URL!');
    setTimeout(() => setCopiedWebhook(false), 2000);
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
                Update display name, environment tags, default domain proxy, working paths, and Git specs.
              </p>
            </div>
            <Button size="sm" disabled={saving} onClick={handleSaveSettings} className="h-8 text-xs gap-1 bg-blue-600">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save All Settings</span>
            </Button>
          </div>

          <div className="space-y-6 max-w-3xl">
            {/* Section 1: General Specs */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider text-slate-500">
                1. General Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Project Display Name</Label>
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

                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Project Notes & Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description or deployment notes..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Runtime Engine & PM2 Specs */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Runtime Engine & PM2 Process Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>PM2 Process Name</Label>
                  <Input
                    value={pm2Name}
                    onChange={(e) => setPm2Name(e.target.value)}
                    className="h-9 text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Runtime Framework / Engine</Label>
                  <Input
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="NestJS / Node.js 20"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Internal Listening Port</Label>
                  <Input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>PM2 Execution Mode / Instances</Label>
                  <Input
                    value={pm2Instances}
                    onChange={(e) => setPm2Instances(e.target.value)}
                    placeholder="4 cluster workers or 1 process"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Directory & Domain Proxy Specs */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Directory & Domain Proxy Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>VPS Working Directory</Label>
                  <Input
                    value={workingDir}
                    onChange={(e) => setWorkingDir(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Default Domain Proxy</Label>
                  <Input
                    value={domainProxy}
                    onChange={(e) => setDomainProxy(e.target.value)}
                    placeholder="api.yourdomain.io"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Git Source Control & Webhook Auto-Deploy */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. Git Source Control & Automated Webhook Deployment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Git Repository URL</Label>
                  <Input
                    value={gitRepo}
                    onChange={(e) => setGitRepo(e.target.value)}
                    placeholder="git@github.com:org/repo.git"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Tracked Branch</Label>
                  <Input
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    placeholder="main"
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Git Auto-Deploy Webhook Trigger URL</span>
                    </Label>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyWebhook}
                      className="h-6 px-2 text-[11px] gap-1 hover:bg-slate-100"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy Webhook'}</span>
                    </Button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Cấu hình URL này vào GitHub/GitLab Repository Webhook để tự động trigger Re-deploy khi push code mới:
                  </p>

                  <div className="p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[11px] break-all select-all">
                    {webhookUrl}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Target Infrastructure Spec */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-700" />
                <span>5. Target Infrastructure Host Node Spec</span>
              </h3>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 font-sans block text-[11px]">VPS Node Name</span>
                  <span className="font-semibold text-slate-900">{proj.hostVpsName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block text-[11px]">VPS Server IP</span>
                  <span className="font-semibold text-blue-600">{proj.hostVpsIp}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block text-[11px]">Unique Project ID</span>
                  <span className="font-semibold text-slate-800">{projectId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone: Stop process & remove project</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Lệnh này sẽ tự động ngắt tiến trình PM2 đang chạy trên VPS và xóa dự án khỏi cơ sở dữ liệu hệ thống.
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
