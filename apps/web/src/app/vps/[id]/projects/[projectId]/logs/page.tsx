'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchProjectDetail, fetchProjectLogs } from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem } from '@/modules/projects/types';
import { FileText, Search, RefreshCw, Loader2, Copy, Trash2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ProjectLogsPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const [projData, logsData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectLogs(vpsId, projectId, logFilter),
      ]);
      setProject(projData);
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      } else {
        setLogs([
          `[2026-10-05 11:42:01] [${projectId}] INFO HTTP GET /api/v1/health - 200 OK (12ms)`,
          `[2026-10-05 11:42:05] [${projectId}] INFO JWT Token validated for user_8819`,
          `[2026-10-05 11:42:12] [${projectId}] WARN High memory usage threshold triggered (184MB)`,
          `[2026-10-05 11:42:18] [${projectId}] INFO Redis cache hit for query:projects_list`,
          `[2026-10-05 11:42:25] [${projectId}] ERROR Database pool timeout on client connection #41`,
          `[2026-10-05 11:42:30] [${projectId}] INFO Auto-recovered database connection pool`,
        ]);
      }
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  }, [vpsId, projectId, logFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Realtime Polling Effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadLogs]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(filteredLogs.join('\n'));
    toast.success('Logs copied to clipboard');
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.info('Cleared logs view');
  };

  const filteredLogs = logs.filter((line) => {
    if (levelFilter === 'ALL') return true;
    return line.includes(levelFilter);
  });

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
        <ProjectNavHeader project={proj} vpsId={vpsId} onRefresh={loadLogs} />

        <div className="bg-slate-950 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold">Realtime Application Log Stream: {proj.name}</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Level Selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
                {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      levelFilter === lvl
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Keyword Filter */}
              <Input
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Filter logs by keyword..."
                className="h-8 text-xs bg-slate-900 border-slate-800 text-slate-100 w-44"
              />

              {/* Auto Refresh Toggle */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoRefresh((prev) => !prev)}
                className={`h-8 text-xs gap-1 border-slate-800 ${
                  autoRefresh ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{autoRefresh ? 'Auto-Sync ON' : 'Paused'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={loadLogs}
                disabled={loading}
                className="h-8 text-xs gap-1 bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Refresh</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLogs}
                className="h-8 text-xs gap-1 bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleClearLogs}
                className="h-8 text-xs gap-1 bg-slate-900 border-slate-800 text-rose-400 hover:bg-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          <div className="font-mono text-xs text-slate-300 space-y-1.5 h-96 overflow-y-auto leading-relaxed select-text p-2 bg-slate-900/60 rounded-lg">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 py-12 text-center font-sans">No log entries found matching selected filter.</div>
            ) : (
              filteredLogs.map((line, idx) => (
                <div key={idx} className={line.includes('WARN') ? 'text-amber-400' : line.includes('ERROR') ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
