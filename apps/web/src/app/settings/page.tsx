'use client';

import { DashboardShell } from '@/components/common/dashboard-shell';
import { Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GlobalSettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Platform Settings & Global API Keys</h1>
            <p className="text-sm text-slate-500">
              Configure global telemetry ping intervals, notification webhooks, and team access permissions.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <Label>Telemetry Heartbeat Interval (Seconds)</Label>
            <Input defaultValue="10" className="h-9 text-xs font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Slack / Discord Alert Webhook URL</Label>
            <Input defaultValue="https://hooks.slack.com/services/T00000000/B00000000/XXXXX" className="h-9 text-xs font-mono" />
          </div>
          <Button size="sm" className="h-9 text-xs bg-blue-600">Save Platform Config</Button>
        </div>
      </div>
    </DashboardShell>
  );
}
