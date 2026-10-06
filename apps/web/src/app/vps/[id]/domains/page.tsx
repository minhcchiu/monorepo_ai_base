'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { fetchVpsDomains } from '@/modules/vps/api';
import { VpsDomainItem } from '@/modules/vps/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, ShieldCheck } from 'lucide-react';

export default function VpsDomainsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { data: cluster, isLoading } = useVpsDetail(id);
  const [domains, setDomains] = useState<VpsDomainItem[]>([]);

  const loadDomains = useCallback(async () => {
    try {
      const data = await fetchVpsDomains(id);
      setDomains(data);
    } catch (e) {
      //
    }
  }, [id]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  if (isLoading || !cluster) {
    return (
      <DashboardShell>
        <div className="space-y-6 max-w-[1440px] mx-auto">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <ClusterNavHeader cluster={cluster} />
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>Nginx Domains & SSL Certificates</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-3">Domain</th>
                  <th className="py-3 px-3">Target Proxy App</th>
                  <th className="py-3 px-3">SSL Status</th>
                  <th className="py-3 px-3">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {domains.map((dom) => (
                  <tr key={dom.id}>
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{dom.domainName}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{dom.targetApp}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Let's Encrypt SSL</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{dom.sslExpiryDays} days remaining</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
