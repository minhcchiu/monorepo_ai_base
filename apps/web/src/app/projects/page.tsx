'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Folder,
  Search,
  Plus,
  Server,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { fetchProjects } from '@/modules/projects/api';
import { ProjectItem } from '@/modules/projects/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GlobalProjectsPage() {
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data);
      }
    } catch (e) {
      //
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.domainProxy.toLowerCase().includes(search.toLowerCase()) ||
    p.hostVpsName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold font-mono">
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200/60 uppercase">
                Global Applications Fleet
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-1">
              Projects & Deployments
            </h1>
            <p className="text-sm text-slate-500">
              Overview of all application services, domain proxies, git branches, and live PM2 processes across all VPS nodes.
            </p>
          </div>

          <Link href="/vps/add">
            <Button size="sm" className="h-9 px-4 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" />
              <span>Deploy New Project</span>
            </Button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project name, domain, branch, or VPS..."
              className="h-9 pl-9 pr-10 text-xs"
            />
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-4">Project Name & Engine</th>
                  <th className="py-3 px-4">Host VPS Server</th>
                  <th className="py-3 px-4">Env</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">PM2 Architecture</th>
                  <th className="py-3 px-4">Port & Domain Proxy</th>
                  <th className="py-3 px-4">Git Branch & Hash</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((proj) => {
                  const targetVpsId = 'api-prod-cluster-01';
                  const targetUrl = `/vps/${targetVpsId}/projects/${proj.id}`;

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <Link href={targetUrl} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                          {proj.name}
                        </Link>
                        <div className="text-[11px] text-slate-500">{proj.engine}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{proj.hostVpsName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{proj.hostVpsIp}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                          {proj.environment}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="capitalize">{proj.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{proj.pm2Instances}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-900">{proj.domainProxy}</div>
                        <div className="text-[11px] text-slate-500">Port {proj.port}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                          <span>{proj.gitBranch}</span>
                        </div>
                        <div className="text-[11px] text-blue-600">#{proj.gitHash}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={targetUrl}>
                          <Button size="sm" className="h-8 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                            <span>Manage Project</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
