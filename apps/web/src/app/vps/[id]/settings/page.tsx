'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useVpsDetail } from '@/modules/vps/hooks/use-vps';
import { ClusterNavHeader } from '@/modules/vps/components/cluster-nav-header';
import { updateVpsNode, deleteVpsNode } from '@/modules/vps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Sliders, AlertTriangle, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function VpsSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const router = useRouter();
  const { data: cluster, isLoading } = useVpsDetail(id);

  const [name, setName] = useState('');
  const [port, setPort] = useState<number | string>(22);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (cluster) {
      setName(cluster.name);
      setPort(cluster.port || 22);
    }
  }, [cluster]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateVpsNode(id, { name, port: Number(port) });
      toast.success('VPS settings updated in database');
    } catch (e) {
      toast.error('Failed to update VPS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to disconnect & remove this server from fleet?')) return;
    try {
      setDeleting(true);
      await deleteVpsNode(id);
      toast.success('VPS node removed from fleet');
      router.push('/vps');
    } catch (e) {
      toast.error('Failed to remove VPS node');
    } finally {
      setDeleting(false);
    }
  };

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
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-slate-700" />
              <span>VPS Configuration & Heartbeat Thresholds</span>
            </h2>
            <Button size="sm" disabled={saving} onClick={handleSave} className="h-8 text-xs gap-1 bg-blue-600">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Settings</span>
            </Button>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label>SSH Port</Label>
              <Input value={port} onChange={(e) => setPort(e.target.value)} className="h-9 text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>CPU Warning Alert Threshold (%)</Label>
              <Input defaultValue="85" className="h-9 text-xs font-mono" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone: Remove this server from fleet</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
              className="h-8 text-xs gap-1"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Disconnect Server</span>
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
