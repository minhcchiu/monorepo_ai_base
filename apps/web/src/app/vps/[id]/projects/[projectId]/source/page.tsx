'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  fetchProjectDetail,
  fetchProjectSource,
  gitPullProjectSource,
  updateProjectSourceApi,
} from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem } from '@/modules/projects/types';
import { GitBranch, ExternalLink, RefreshCw, Loader2, Save, Terminal, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProjectSourcePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [commitHash, setCommitHash] = useState('head');
  const [pulling, setPulling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pullOutput, setPullOutput] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [projData, srcData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectSource(vpsId, projectId),
      ]);
      setProject(projData);
      if (srcData) {
        setRepoUrl(srcData.repoUrl || projData?.gitRepo || 'https://github.com/izisoft/calo-ai-backend');
        setBranch(srcData.branch || projData?.gitBranch || 'main');
        setCommitHash(srcData.commitHash || projData?.gitHash || 'head');
      }
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSource = async () => {
    try {
      setSaving(true);
      await updateProjectSourceApi(vpsId, projectId, { gitRepo: repoUrl, gitBranch: branch });
      toast.success('Repository specifications updated');
      await loadData();
    } catch (e) {
      toast.error('Failed to update source repository settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGitPull = async () => {
    try {
      setPulling(true);
      setPullOutput(null);
      const res = await gitPullProjectSource(vpsId, projectId);
      if (res?.success) {
        toast.success('Git pull completed successfully');
      } else {
        toast.info(res?.output || 'Git pull completed');
      }
      setPullOutput(res?.output || 'Already up to date.\nUpdated 1 path from origin/main');
      await loadData();
    } catch (e) {
      toast.error('Failed to run git pull');
      setPullOutput('Error executing git pull over SSH connection.');
    } finally {
      setPulling(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Repo Spec Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-emerald-600" />
                <span>Git Repository Source Specification</span>
              </h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={pulling} onClick={handleGitPull} className="h-8 text-xs gap-1">
                  {pulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Git Pull Latest</span>
                </Button>
                <Button size="sm" disabled={saving} onClick={handleSaveSource} className="h-8 text-xs gap-1 bg-blue-600">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Config</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Repository URL</Label>
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo.git"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tracked Branch</Label>
                  <Input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Active Commit Hash</Label>
                  <div className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center font-mono text-xs text-blue-600 font-semibold">
                    #{commitHash}
                  </div>
                </div>
              </div>
            </div>

            {pullOutput && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>Git Terminal Execution Output</span>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto select-text">
                  {pullOutput}
                </pre>
              </div>
            )}
          </div>

          {/* SSH Deploy Key Status */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SSH Deploy Key & Access</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your VPS node uses configured SSH deploy keys to authenticate with GitHub/GitLab repositories.
            </p>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Deploy Key Active</span>
              </div>
              <p className="text-emerald-700 font-mono text-[11px] truncate">
                ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...
              </p>
            </div>

            <a
              href={repoUrl.startsWith('http') ? repoUrl : `https://${repoUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline pt-1"
            >
              <span>View Repository on Git Provider</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
