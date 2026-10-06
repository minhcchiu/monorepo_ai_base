'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchProjectPortsApi, updateProjectPortsApi } from '../api';
import { Network, Save, Loader2, RefreshCw, CheckCircle2, Zap, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PortManagerCardProps {
  vpsId: string;
  projectId: string;
  onPortsUpdated?: () => void;
}

export function PortManagerCard({ vpsId, projectId, onPortsUpdated }: PortManagerCardProps) {
  const [backendPort, setBackendPort] = useState<number | string>(3001);
  const [adminPort, setAdminPort] = useState<number | string>(3000);
  const [webPort, setWebPort] = useState<number | string>(3002);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPorts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProjectPortsApi(vpsId, projectId);
      if (res?.success) {
        if (res.backendPort) setBackendPort(res.backendPort);
        if (res.adminPort) setAdminPort(res.adminPort);
        if (res.webPort) setWebPort(res.webPort);
      }
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  }, [vpsId, projectId]);

  useEffect(() => {
    loadPorts();
  }, [loadPorts]);

  const handleApplyPortChanges = async () => {
    try {
      setSaving(true);
      const res = await updateProjectPortsApi(vpsId, projectId, {
        backendPort: Number(backendPort),
        adminPort: Number(adminPort),
        webPort: Number(webPort),
      });

      toast.success(
        res?.message || 'Đã đổi Port, cập nhật .env, Nginx & reload PM2 thành công!',
      );
      if (onPortsUpdated) onPortsUpdated();
      await loadPorts();
    } catch (e: any) {
      toast.error('Đổi Port thất bại. Vui lòng kiểm tra lại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            <span>Trình Quản Lý Port Tiến Trình (Centralized Monorepo Port Allocation)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Quản lý và thay đổi cổng lắng nghe cho từng Sub-App. Đổi Port 1-click tự động cập nhật file `.env`, file cấu hình Nginx & hot-reload PM2!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={loadPorts}
            className="h-8 text-xs gap-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Tải lại</span>
          </Button>

          <Button
            size="sm"
            disabled={saving}
            onClick={handleApplyPortChanges}
            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>⚡ Đổi Port & Hot Reload Dịch Vụ</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Backend App Port Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Server className="w-4 h-4 text-blue-600" />
              <span>1. Backend API (`apps/backend`)</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-sans">
              NestJS
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <Label className="font-sans text-[11px] text-slate-600">Port Lắng Nghe</Label>
            <Input
              value={backendPort}
              onChange={(e) => setBackendPort(e.target.value)}
              className="h-9 text-xs font-mono font-bold text-blue-600 bg-white"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Tự động cập nhật `apps/backend/.env` (PORT={backendPort})</span>
          </div>
        </div>

        {/* Web Admin App Port Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>2. Web Admin (`apps/web-admin`)</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold font-sans">
              Next.js
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <Label className="font-sans text-[11px] text-slate-600">Port Lắng Nghe</Label>
            <Input
              value={adminPort}
              onChange={(e) => setAdminPort(e.target.value)}
              className="h-9 text-xs font-mono font-bold text-indigo-600 bg-white"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Tự động cập nhật `apps/web-admin/.env` (PORT={adminPort})</span>
          </div>
        </div>

        {/* Web User App Port Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>3. Web User App (`apps/web`)</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-sans">
              Next.js
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <Label className="font-sans text-[11px] text-slate-600">Port Lắng Nghe</Label>
            <Input
              value={webPort}
              onChange={(e) => setWebPort(e.target.value)}
              className="h-9 text-xs font-mono font-bold text-emerald-600 bg-white"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Tự động cập nhật `apps/web/.env` (PORT={webPort})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
