'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchProjectDetail, fetchProjectActivity } from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem, ProjectActivityItem } from '@/modules/projects/types';
import { History, Rocket, RotateCw, Key, Globe, ShieldAlert, Sliders } from 'lucide-react';
import { Input } from '@/components/ui/input';

function formatTimeAgo(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : 'Recently';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

export default function ProjectActivityPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [activities, setActivities] = useState<ProjectActivityItem[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const [projData, actData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectActivity(vpsId, projectId),
      ]);
      setProject(projData);
      if (Array.isArray(actData)) {
        setActivities(actData);
      }
    } catch (e) {
      //
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredActivities = activities.filter((act) => {
    if (filterType !== 'ALL' && act.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return act.title.toLowerCase().includes(q) || act.description.toLowerCase().includes(q);
    }
    return true;
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPLOY':
        return <Rocket className="w-4 h-4 text-blue-600" />;
      case 'PM2':
        return <RotateCw className="w-4 h-4 text-indigo-600" />;
      case 'ENV':
        return <Key className="w-4 h-4 text-amber-600" />;
      case 'DOMAIN':
        return <Globe className="w-4 h-4 text-emerald-600" />;
      case 'NGINX':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      default:
        return <Sliders className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ProjectNavHeader project={proj} vpsId={vpsId} onRefresh={loadData} />

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <span>Audit Trail & Activity Log</span>
              </h2>
              <p className="text-xs text-slate-500">
                System operations and change history for {proj.name}.
              </p>
            </div>

            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="h-8 text-xs w-52"
            />
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1.5 flex-wrap font-sans text-xs">
            {['ALL', 'DEPLOY', 'PM2', 'ENV', 'DOMAIN', 'NGINX', 'SYSTEM'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === cat
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-1">
            {filteredActivities.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">No activity records found matching filters.</div>
            ) : (
              filteredActivities.map((act) => (
                <div key={act.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                    {getIcon(act.type)}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{act.title}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatTimeAgo((act as any).createdAt || act.time)}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
