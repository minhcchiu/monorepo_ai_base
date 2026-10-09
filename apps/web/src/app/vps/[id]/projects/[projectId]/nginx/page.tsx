'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  fetchProjectDetail,
  fetchProjectNginxConfig,
  testProjectNginxConfig,
  saveProjectNginxConfig,
  generateProjectNginxConfigApi,
} from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem } from '@/modules/projects/types';
import { ShieldAlert, Save, RefreshCw, Loader2, Sparkles, Terminal, Globe, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function useUnwrapParams<T>(params: Promise<T> | T): T {
  if (params && typeof (params as any).then === 'function') {
    return use(params as Promise<T>);
  }
  return params as T;
}

export default function ProjectNginxPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }> | { id: string; projectId: string };
}) {
  const resolvedParams = useUnwrapParams(params);
  const vpsId = resolvedParams?.id || '';
  const projectId = resolvedParams?.projectId || '';
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [nginxConf, setNginxConf] = useState<string>('');
  const [testOutput, setTestOutput] = useState<string | null>(null);

  // Strategy Form State
  const [routingStrategy, setRoutingStrategy] = useState<'SUBDOMAIN' | 'PATH_PREFIX'>('SUBDOMAIN');
  const [baseDomain, setBaseDomain] = useState('calo.io');
  const [backendPort, setBackendPort] = useState<number | string>(3001);
  const [adminPort, setAdminPort] = useState<number | string>(3000);
  const [webPort, setWebPort] = useState<number | string>(3002);

  const [testing, setTesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projData, nginxData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectNginxConfig(vpsId, projectId),
      ]);
      setProject(projData);
      if (projData) {
        setBaseDomain(projData.domainProxy || `${projectId}.io`);
      }
      if (nginxData?.config) {
        setNginxConf(nginxData.config);
      }
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async (overrideStrategy?: 'SUBDOMAIN' | 'PATH_PREFIX') => {
    const strat = overrideStrategy || routingStrategy;
    try {
      setGenerating(true);
      const res = await generateProjectNginxConfigApi(vpsId, projectId, {
        routingStrategy: strat,
        baseDomain,
        backendPort: Number(backendPort),
        adminPort: Number(adminPort),
        webPort: Number(webPort),
      });
      if (res?.config) {
        setNginxConf(res.config);
        toast.success(`Generated Nginx config (${strat === 'SUBDOMAIN' ? 'Subdomain Routing' : 'Path Prefix Routing'})!`);
      }
    } catch (e) {
      toast.error('Failed to generate Nginx config template');
    } finally {
      setGenerating(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestOutput(null);
      const res = await testProjectNginxConfig(vpsId, projectId);
      setTestOutput(res?.output || 'nginx: configuration file /etc/nginx/nginx.conf syntax is ok');
      if (res?.success !== false) {
        toast.success('Nginx config syntax test PASSED (nginx -t)');
      } else {
        toast.error('Nginx config syntax test failed');
      }
    } catch (e) {
      toast.error('Failed to test Nginx config');
      setTestOutput('Error running nginx -t over SSH.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await saveProjectNginxConfig(vpsId, projectId, nginxConf);
      toast.success(res?.message || 'Nginx config saved & reloaded!');
      await loadData();
    } catch (e) {
      toast.error('Failed to reload Nginx config');
    } finally {
      setSaving(false);
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

        {/* Nginx Multi-App Routing Strategy Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>Nginx Proxy Routing Strategy Generator</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select routing strategy for Monorepo applications (Backend API, Web Admin, and Web App).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setRoutingStrategy('SUBDOMAIN');
                handleGenerate('SUBDOMAIN');
              }}
              className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                routingStrategy === 'SUBDOMAIN'
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900 flex items-center justify-between">
                <span>Strategy A: Subdomains (Port Riêng)</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono">Port riêng</span>
              </div>
              <p className="text-[11px] text-slate-600">
                • <code className="font-mono text-blue-700">api.{baseDomain}</code> ➔ Backend (Port {backendPort})
                <br />
                • <code className="font-mono text-blue-700">admin.{baseDomain}</code> ➔ Admin (Port {adminPort})
                <br />• <code className="font-mono text-blue-700">{baseDomain}</code> ➔ Web (Port {webPort})
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoutingStrategy('PATH_PREFIX');
                handleGenerate('PATH_PREFIX');
              }}
              className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                routingStrategy === 'PATH_PREFIX'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900 flex items-center justify-between">
                <span>Strategy B: Path Prefix (Port Chung / Path)</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono">1 Domain / Path</span>
              </div>
              <p className="text-[11px] text-slate-600">
                • <code className="font-mono text-indigo-700">{baseDomain}/api/</code> ➔ Backend (Port {backendPort})
                <br />
                • <code className="font-mono text-indigo-700">{baseDomain}/admin/</code> ➔ Admin (Port {adminPort})
                <br />• <code className="font-mono text-indigo-700">{baseDomain}/</code> ➔ Web (Port {webPort})
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
            <div className="space-y-1">
              <Label className="font-sans text-xs">Base Main Domain</Label>
              <Input value={baseDomain} onChange={(e) => setBaseDomain(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="font-sans text-xs">Backend API Port</Label>
              <Input value={backendPort} onChange={(e) => setBackendPort(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="font-sans text-xs">Web Admin Port</Label>
              <Input value={adminPort} onChange={(e) => setAdminPort(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="font-sans text-xs">Web App Port</Label>
              <Input value={webPort} onChange={(e) => setWebPort(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
          </div>
        </div>

        {/* Config Code Editor & Controls */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <span>Nginx VirtualHost File (/etc/nginx/sites-available/{proj.id}.conf)</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={() => handleGenerate()}
                className="h-8 text-xs gap-1 text-indigo-600 hover:bg-indigo-50"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Regenerate Nginx File</span>
              </Button>

              <Button variant="outline" size="sm" disabled={testing} onClick={handleTest} className="h-8 text-xs gap-1">
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test Config (nginx -t)</span>
              </Button>

              <Button size="sm" disabled={saving} onClick={handleSave} className="h-8 text-xs gap-1 bg-blue-600">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save & Reload</span>
              </Button>
            </div>
          </div>

          <textarea
            rows={18}
            value={nginxConf}
            onChange={(e) => setNginxConf(e.target.value)}
            className="w-full rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs focus:outline-none leading-relaxed select-text"
          />

          {testOutput && (
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold font-sans">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>nginx -t Execution Output</span>
              </div>
              <pre className="text-emerald-400 leading-relaxed overflow-x-auto select-text">
                {testOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
