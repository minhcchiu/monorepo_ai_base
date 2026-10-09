'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  fetchProjectDetail,
  fetchProjectDeployments,
  triggerProjectDeployment,
  rollbackProjectDeployment,
  fetchProjectGitlabCiConfigApi,
  fetchProjectEnvironment,
  syncGitlabVariablesApi,
  triggerGitlabPipelineApi,
} from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem, DeploymentItem } from '@/modules/projects/types';
import { Rocket, CheckCircle2, RotateCw, Loader2, FileText, XCircle, Copy, Terminal, Plus, GitBranch, RefreshCw, Sparkles, Play, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ProjectDeploymentsPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [selectedLogDeployment, setSelectedLogDeployment] = useState<DeploymentItem | null>(null);

  // Deploy Dialog State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'INITIAL' | 'RE_DEPLOY' | 'GITLAB_CI'>('RE_DEPLOY');

  // Form State for Deploy Modes
  const [deployDir, setDeployDir] = useState('');
  const [buildFilter, setBuildFilter] = useState('');
  const [runPrismaDbPush, setRunPrismaDbPush] = useState(true);
  const [authorName, setAuthorName] = useState('Admin User');
  const [envText, setEnvText] = useState('');

  // GitLab CI Config & Variables State
  const [gitlabCiConfig, setGitlabCiConfig] = useState<string>('');
  const [gitlabToken, setGitlabToken] = useState('');
  const [ciServerIp, setCiServerIp] = useState('36.50.176.26');
  const [ciDeployDir, setCiDeployDir] = useState('/home/production-deploys/pa01calo');
  const [ciServerUser, setCiServerUser] = useState('root');
  const [ciSshPrivateKey, setCiSshPrivateKey] = useState('-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END OPENSSH PRIVATE KEY-----');

  const [syncingVars, setSyncingVars] = useState(false);
  const [triggeringPipeline, setTriggeringPipeline] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projData, depsData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectDeployments(vpsId, projectId),
      ]);
      setProject(projData);

      if (projData) {
        setDeployDir(projData.workingDir || `/home/production-deploys/${projectId}`);
        setCiDeployDir(projData.workingDir || `/home/production-deploys/${projectId}`);
        setCiServerIp(projData.hostVpsIp || '36.50.176.26');
        setBuildFilter(`@calo_ai/${projectId}`);
      }

      if (Array.isArray(depsData) && depsData.length > 0) {
        setDeployments(depsData);
      } else {
        setDeployments([
          {
            id: '1',
            buildNumber: '#210',
            commitHash: 'c9f82a1',
            branch: 'main',
            author: 'Tuấn Lê',
            status: 'SUCCESS',
            timeAgo: '18m ago',
            triggeredBy: 'Re-deploy Trigger',
            logs: '[SSH] exec: git pull origin main\nAlready up to date.\n[PM2] reload process calo-ai-backend\n[PM2] Process successfully reloaded',
          },
          {
            id: '2',
            buildNumber: '#209',
            commitHash: 'b4412e0',
            branch: 'main',
            author: 'Minh Nguyễn',
            status: 'SUCCESS',
            timeAgo: '1d ago',
            triggeredBy: 'Initial Full Setup',
            logs: '[SSH] exec: git clone git@gitlab.com:izisoftware2020/pa01calo.git\nCloning into /home/production-deploys/pa01calo...\n[pnpm] install dependencies...\n[PM2] start ecosystem.config.js',
          },
        ]);
      }
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedLogDeployment || selectedLogDeployment.status !== 'RUNNING') return;

    const interval = setInterval(async () => {
      try {
        const deps = await fetchProjectDeployments(vpsId, projectId);
        if (Array.isArray(deps) && deps.length > 0) {
          setDeployments(deps);
          const updated = deps.find((d: any) => d.id === selectedLogDeployment.id);
          if (updated) {
            setSelectedLogDeployment(updated);
          }
        }
      } catch (e) {
        //
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedLogDeployment, vpsId, projectId]);

  const handleOpenDeployModal = async () => {
    setIsDeployModalOpen(true);
    try {
      const [res, envData] = await Promise.all([
        fetchProjectGitlabCiConfigApi(vpsId, projectId),
        fetchProjectEnvironment(vpsId, projectId),
      ]);
      if (res?.config) {
        setGitlabCiConfig(res.config);
      }
      if (Array.isArray(envData) && envData.length > 0) {
        setEnvText(envData.map((v: any) => `${v.key}=${v.value}`).join('\n'));
      }
    } catch (e) {
      //
    }
  };

  const handleSyncGitlabVariables = async () => {
    const gitRepo = project?.gitRepo || `git@gitlab.com:izisoftware2020/${projectId}.git`;
    try {
      setSyncingVars(true);
      const res = await syncGitlabVariablesApi(vpsId, {
        gitRepo,
        gitlabToken,
        variables: [
          { key: 'SERVER_IP', value: ciServerIp || project?.hostVpsIp || '36.50.176.26', masked: false },
          { key: 'DEPLOY_DIR', value: ciDeployDir || deployDir, masked: false },
          { key: 'SERVER_USER', value: ciServerUser || 'root', masked: false },
          { key: 'SSH_PRIVATE_KEY', value: ciSshPrivateKey, masked: false },
        ],
      });
      toast.success(res?.message || 'Đã đồng bộ 4 biến CI/CD Variables lên GitLab repository!');
    } catch (e: any) {
      toast.error('Đồng bộ biến CI/CD thất bại. Vui lòng kiểm tra GitLab Access Token');
    } finally {
      setSyncingVars(false);
    }
  };

  const handleTriggerPipeline = async () => {
    const gitRepo = project?.gitRepo || `git@gitlab.com:izisoftware2020/${projectId}.git`;
    try {
      setTriggeringPipeline(true);
      const res = await triggerGitlabPipelineApi(vpsId, {
        gitRepo,
        gitlabToken,
        branch: project?.gitBranch || 'main',
      });
      toast.success(res?.message || 'Đã kích hoạt chạy GitLab CI/CD Pipeline!');
    } catch (e) {
      toast.error('Kích hoạt pipeline thất bại');
    } finally {
      setTriggeringPipeline(false);
    }
  };

  const handleExecuteDeploy = async (mode: 'INITIAL' | 'RE_DEPLOY') => {
    try {
      setDeploying(true);
      const res = await triggerProjectDeployment(vpsId, projectId, {
        deployMode: mode,
        author: authorName,
        deployDir,
        buildFilter,
        runPrismaDbPush,
        envText,
      });

      toast.success(
        mode === 'INITIAL'
          ? `Initial Full Deployment build ${res?.buildNumber || '#211'} started!`
          : `Re-deployment build ${res?.buildNumber || '#211'} started!`,
      );
      setIsDeployModalOpen(false);
      if (res) {
        setSelectedLogDeployment(res);
      }
      await loadData();
    } catch (e: any) {
      toast.error('Deployment execution failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleCopyGitlabCi = () => {
    navigator.clipboard.writeText(gitlabCiConfig);
    toast.success('Copied .gitlab-ci.yml template to clipboard');
  };

  const handleRollback = async (depId: string, buildNum: string) => {
    try {
      setRollingBackId(depId);
      const res = await rollbackProjectDeployment(vpsId, projectId, depId);
      toast.info(res?.message || `Rolled back to ${buildNum}`);
      await loadData();
    } catch (e: any) {
      toast.error('Rollback failed');
    } finally {
      setRollingBackId(null);
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

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                <span>Deployment & Rollback History</span>
              </h2>
              <p className="text-xs text-slate-500">
                Manage initial project setup, direct re-deployments, and GitLab CI integration.
              </p>
            </div>
            <Button size="sm" onClick={handleOpenDeployModal} className="h-8 text-xs bg-blue-600 gap-1">
              <Rocket className="w-3.5 h-3.5" />
              <span>Deploy Options</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-4">Build #</th>
                  <th className="py-3 px-4">Commit Hash</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Triggered By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-blue-600">{d.buildNumber}</td>
                    <td className="py-3.5 px-4 text-slate-900">#{d.commitHash}</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.branch}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-700">{d.author}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-500 text-[11px]">{d.triggeredBy || 'Manual'}</td>
                    <td className="py-3.5 px-4 font-sans">
                      {d.status?.toUpperCase() === 'SUCCESS' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SUCCESS</span>
                        </span>
                      ) : d.status?.toUpperCase() === 'RUNNING' || d.status?.toUpperCase() === 'QUEUED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[11px] inline-flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          <span>BUILDING</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px] inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">{d.timeAgo}</td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLogDeployment(d)}
                          className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-900"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Build Log</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rollingBackId === d.id}
                          onClick={() => handleRollback(d.id, d.buildNumber)}
                          className="h-7 text-xs gap-1"
                        >
                          {rollingBackId === d.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="w-3.5 h-3.5" />
                          )}
                          <span>Rollback</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deployment Modes & GitLab CI Modal */}
      <Dialog open={isDeployModalOpen} onOpenChange={setIsDeployModalOpen}>
        <DialogContent className="w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600" />
              <span>Project Deployment Options ({proj.name})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('RE_DEPLOY')}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'RE_DEPLOY' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>2. Re-deploy Code mới</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('INITIAL')}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'INITIAL' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>1. Dự án mới (Khởi tạo từ đầu)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('GITLAB_CI')}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'GITLAB_CI' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>.gitlab-ci.yml & Variables</span>
              </button>
            </div>

            {/* TAB 1: INITIAL SETUP */}
            {activeTab === 'INITIAL' && (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Trường hợp 1: Dự án mới hoàn toàn chưa deploy.</span> Hệ thống sẽ tự động tạo thư mục <code className="font-mono bg-amber-100 px-1 rounded">{deployDir}</code>, thực thi <code className="font-mono bg-amber-100 px-1 rounded">git clone</code>, cài đặt dependencies, tạo file <code className="font-mono bg-amber-100 px-1 rounded">.env</code>, chạy DB push và khởi động PM2.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Deploy Directory (DEPLOY_DIR)</Label>
                    <Input value={deployDir} onChange={(e) => setDeployDir(e.target.value)} className="h-9 text-xs font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Build Filter Package</Label>
                    <Input value={buildFilter} onChange={(e) => setBuildFilter(e.target.value)} className="h-9 text-xs font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Author / Triggered By</Label>
                    <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="h-9 text-xs" />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={runPrismaDbPush}
                        onChange={(e) => setRunPrismaDbPush(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Run Prisma DB Push (`pnpm prisma db push`)</span>
                    </label>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsDeployModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={deploying} onClick={() => handleExecuteDeploy('INITIAL')} className="bg-blue-600 text-xs gap-1">
                    {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                    <span>Khởi tạo & Deploy Full</span>
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* TAB 2: RE-DEPLOY */}
            {activeTab === 'RE_DEPLOY' && (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">Trường hợp 2: Dự án đã deploy trước đó.</span> Hệ thống sẽ thực thi <code className="font-mono bg-blue-100 px-1 rounded">git pull origin {proj.gitBranch || 'main'}</code>, cài đặt packages mới, build dự án và reload PM2 không ngắt kết nối.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Target Branch</Label>
                    <div className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs font-mono font-bold text-slate-900">
                      {proj.gitBranch || 'main'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Author Name</Label>
                    <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="h-9 text-xs" />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={runPrismaDbPush}
                    onChange={(e) => setRunPrismaDbPush(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Run Prisma DB Push (`pnpm prisma db push`)</span>
                </label>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-slate-700">Chỉnh sửa biến môi trường .env (Tùy chọn)</Label>
                  <textarea
                    rows={6}
                    value={envText}
                    onChange={(e) => setEnvText(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 text-emerald-400 p-3 font-mono text-xs leading-relaxed focus:outline-none border border-slate-800"
                    placeholder={`PORT=22090\nNODE_ENV=production\nDATABASE_URL=...`}
                  />
                  <p className="text-[11px] text-slate-500">
                    Nội dung .env này sẽ được cập nhật lên VPS trước khi chạy build. Nếu để trống, hệ thống giữ nguyên file `.env` sẵn có trên VPS.
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsDeployModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={deploying} onClick={() => handleExecuteDeploy('RE_DEPLOY')} className="bg-blue-600 text-xs gap-1">
                    {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Re-deploy Code Mới</span>
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* TAB 3: GITLAB CI & INTERACTIVE VARIABLES TABLE */}
            {activeTab === 'GITLAB_CI' && (
              <div className="space-y-4 pt-2">
                {/* INTERACTIVE VARIABLES FORM TABLE */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      <span>Bảng Cấu Hình Biến GitLab CI/CD Variables (Pre-filled từ VPS):</span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-mono">Auto-Sync via GitLab API</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    <div className="space-y-1">
                      <Label className="font-sans text-[11px] font-semibold text-slate-700">SERVER_IP</Label>
                      <Input
                        value={ciServerIp}
                        onChange={(e) => setCiServerIp(e.target.value)}
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="font-sans text-[11px] font-semibold text-slate-700">SERVER_USER</Label>
                      <Input
                        value={ciServerUser}
                        onChange={(e) => setCiServerUser(e.target.value)}
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="font-sans text-[11px] font-semibold text-slate-700">DEPLOY_DIR</Label>
                      <Input
                        value={ciDeployDir}
                        onChange={(e) => setCiDeployDir(e.target.value)}
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="font-sans text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>SSH_PRIVATE_KEY (Private Key Truy Cập VPS)</span>
                      </Label>
                      <textarea
                        rows={3}
                        value={ciSshPrivateKey}
                        onChange={(e) => setCiSshPrivateKey(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 text-slate-100 p-2.5 font-mono text-[11px] leading-relaxed focus:outline-none select-text"
                      />
                    </div>
                  </div>

                  {/* GITLAB ACCESS TOKEN & AUTO-SYNC ACTIONS */}
                  <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200/80 space-y-2 pt-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-blue-900">GitLab Personal / Project Access Token</Label>
                      <Input
                        type="password"
                        value={gitlabToken}
                        onChange={(e) => setGitlabToken(e.target.value)}
                        placeholder="glpat-xxxxxxxxxxxxxxxxxxxx (Optional Token)"
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={syncingVars}
                        onClick={handleSyncGitlabVariables}
                        className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        {syncingVars ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>🤖 Tự Động Tạo CI/CD Variables Trên GitLab</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={triggeringPipeline}
                        onClick={handleTriggerPipeline}
                        className="h-8 text-xs gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                      >
                        {triggeringPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        <span>🚀 Kích Hoạt Run Pipeline GitLab</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PREVIEW GITLAB-CI.YML */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      File <code className="font-mono text-indigo-600">.gitlab-ci.yml</code> tự động sinh:
                    </p>
                    <Button size="sm" variant="outline" onClick={handleCopyGitlabCi} className="h-7 text-xs gap-1">
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy .gitlab-ci.yml</span>
                    </Button>
                  </div>

                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto max-h-56 select-text">
                    {gitlabCiConfig || `# Generating .gitlab-ci.yml for ${proj.id}...`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Build Log Viewer Dialog */}
      <Dialog open={!!selectedLogDeployment} onOpenChange={() => setSelectedLogDeployment(null)}>
        <DialogContent className="max-w-4xl sm:max-w-4xl bg-slate-950 text-slate-100 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2 font-mono">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Deployment Build Log ({selectedLogDeployment?.buildNumber})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="text-xs text-slate-400 mb-2 font-sans flex items-center justify-between">
              <span>Triggered by: {selectedLogDeployment?.author}</span>
              <span>Commit: #{selectedLogDeployment?.commitHash}</span>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto max-h-80 select-text">
              {selectedLogDeployment?.logs || 'No build log captured for this deployment.'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
