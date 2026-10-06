'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  fetchProjectDetail,
  fetchProjectEnvironment,
  saveProjectEnvironment,
} from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem } from '@/modules/projects/types';
import { Key, Eye, EyeOff, Save, Loader2, Plus, Trash2, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ProjectEnvironmentPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [saving, setSaving] = useState(false);

  // Bulk Edit Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [rawText, setRawText] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [projData, envData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectEnvironment(vpsId, projectId),
      ]);
      setProject(projData);
      if (Array.isArray(envData)) {
        setEnvVars(envData);
      } else {
        setEnvVars([
          { key: 'PORT', value: String(projData?.port || 3000) },
          { key: 'NODE_ENV', value: 'production' },
          { key: 'DATABASE_URL', value: 'postgresql://postgres:pass_184920@103.56.162.77:5432/calo_prod' },
          { key: 'REDIS_URL', value: 'redis://:red_auth_99182@103.178.234.19:6379/0' },
          { key: 'JWT_SECRET', value: 'super_secret_jwt_key_9918237' },
        ]);
      }
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEnvChange = (index: number, field: 'key' | 'value', newVal: string) => {
    setEnvVars((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: newVal };
      return updated;
    });
  };

  const handleAddRow = () => {
    setEnvVars((prev) => [...prev, { key: 'NEW_VAR', value: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    setEnvVars((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenBulkModal = () => {
    const formatted = envVars.map((e) => `${e.key}=${e.value}`).join('\n');
    setRawText(formatted);
    setIsBulkOpen(true);
  };

  const handleApplyBulkText = () => {
    const lines = rawText.split('\n');
    const parsed: Array<{ key: string; value: string }> = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim();
        if (k) parsed.push({ key: k, value: v });
      }
    });

    if (parsed.length > 0) {
      setEnvVars(parsed);
      toast.success(`Imported ${parsed.length} variables from raw text`);
    } else {
      toast.error('No valid KEY=VALUE pairs found in text');
    }
    setIsBulkOpen(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await saveProjectEnvironment(vpsId, projectId, envVars);
      toast.success(res?.message || 'Saved .env file to VPS project');
      await loadData();
    } catch (e) {
      toast.error('Failed to save .env file');
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

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                <span>Project Environment Variables (.env)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Encrypted environment variables injected into the runtime process on boot.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenBulkModal}
                className="h-8 text-xs gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Bulk Raw Edit</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecrets((prev) => !prev)}
                className="h-8 text-xs gap-1.5"
              >
                {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSecrets ? 'Mask Secrets' : 'Reveal Secrets'}</span>
              </Button>

              <Button size="sm" disabled={saving} onClick={handleSave} className="h-8 text-xs gap-1 bg-blue-600">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {envVars.map((env, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 font-mono text-xs">
                <Input
                  value={env.key}
                  onChange={(e) => handleEnvChange(idx, 'key', e.target.value)}
                  className="h-8 w-56 font-bold bg-white text-xs font-mono"
                />
                <span className="text-slate-400 font-bold">=</span>
                <Input
                  type={showSecrets || env.key === 'PORT' || env.key === 'NODE_ENV' ? 'text' : 'password'}
                  value={env.value}
                  onChange={(e) => handleEnvChange(idx, 'value', e.target.value)}
                  className="h-8 flex-1 bg-white text-xs font-mono"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRow(idx)}
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={handleAddRow} className="h-8 text-xs gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variable Row</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Raw Bulk Import Modal */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileCode className="w-5 h-5 text-amber-600" />
              <span>Import Raw .env Text (Trình Chỉnh Sửa Toàn Màn Hình)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-500">
              Paste or edit raw .env KEY=VALUE lines below. Comments (#) will be skipped.
            </p>
            <textarea
              rows={16}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full rounded-2xl bg-slate-950 text-emerald-400 p-4 font-mono text-xs leading-relaxed focus:outline-none select-text border border-slate-800 shadow-inner"
              placeholder={`PORT=3000\nNODE_ENV=production\nDATABASE_URL=postgresql://...`}
            />

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApplyBulkText} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold px-5">
                Apply Raw .env
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
