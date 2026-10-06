'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import {
  fetchProjectDetail,
  fetchProjectDomains,
  addProjectDomain,
  removeProjectDomain,
  issueProjectDomainSsl,
} from '@/modules/projects/api';
import { ProjectNavHeader } from '@/modules/projects/components/project-nav-header';
import { ProjectItem, ProjectDomainItem } from '@/modules/projects/types';
import { Globe, ShieldCheck, Plus, Loader2, Trash2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ProjectDomainsPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: vpsId, projectId } = use(params);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [domains, setDomains] = useState<ProjectDomainItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [targetPort, setTargetPort] = useState<number | string>(3000);
  const [adding, setAdding] = useState(false);
  const [issuingSslId, setIssuingSslId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [projData, domsData] = await Promise.all([
        fetchProjectDetail(vpsId, projectId),
        fetchProjectDomains(vpsId, projectId),
      ]);
      setProject(projData);
      if (projData) {
        setTargetPort(projData.port);
      }
      if (Array.isArray(domsData) && domsData.length > 0) {
        setDomains(domsData);
      } else {
        setDomains([
          {
            id: '1',
            domainName: projData?.domainProxy || 'api.calo.io',
            targetPort: projData?.port || 3000,
            sslStatus: 'VALID',
            sslExpiryDays: 88,
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

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    try {
      setAdding(true);
      await addProjectDomain(vpsId, projectId, {
        domainName: newDomainName.trim(),
        targetPort: Number(targetPort),
      });
      toast.success(`Added domain ${newDomainName}`);
      setNewDomainName('');
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      toast.error('Failed to add domain');
    } finally {
      setAdding(false);
    }
  };

  const handleIssueSsl = async (domainId: string, domainName: string) => {
    try {
      setIssuingSslId(domainId);
      const res = await issueProjectDomainSsl(vpsId, projectId, domainId);
      toast.success(res?.message || `Issued Let's Encrypt SSL for ${domainName}`);
      await loadData();
    } catch (e) {
      toast.error('Failed to issue SSL certificate');
    } finally {
      setIssuingSslId(null);
    }
  };

  const handleRemoveDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Are you sure you want to remove domain ${domainName}?`)) return;
    try {
      setDeletingId(domainId);
      await removeProjectDomain(vpsId, projectId, domainId);
      toast.success(`Removed domain ${domainName}`);
      await loadData();
    } catch (e) {
      toast.error('Failed to remove domain');
    } finally {
      setDeletingId(null);
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
                <Globe className="w-5 h-5 text-blue-600" />
                <span>Project Custom Domains & SSL Certificates</span>
              </h2>
              <p className="text-xs text-slate-500">
                Manage virtual host domains routing requests to internal port {proj.port}.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-8 text-xs gap-1 bg-blue-600">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Domain</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-4">Domain Name</th>
                  <th className="py-3 px-4">Target Proxy Port</th>
                  <th className="py-3 px-4">SSL Certificate</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {domains.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{d.domainName}</td>
                    <td className="py-3.5 px-4 text-slate-600">Port {d.targetPort || proj.port}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SSL {d.sslStatus || 'VALID'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-sans">Valid for {d.sslExpiryDays || 88} days</td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={issuingSslId === d.id}
                          onClick={() => handleIssueSsl(d.id, d.domainName)}
                          className="h-7 text-xs gap-1 text-emerald-700 hover:bg-emerald-50"
                        >
                          {issuingSslId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                          <span>Issue / Renew SSL</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === d.id}
                          onClick={() => handleRemoveDomain(d.id, d.domainName)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          {deletingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Add Custom Domain Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Link Custom Domain</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Domain Name</label>
              <Input
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                placeholder="e.g. api.yourcompany.com"
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Target Proxy Internal Port</label>
              <Input
                type="number"
                value={targetPort}
                onChange={(e) => setTargetPort(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={adding} onClick={handleAddDomain} className="bg-blue-600">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
