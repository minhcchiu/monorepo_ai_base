'use client';

import { DashboardShell } from '@/components/common/dashboard-shell';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const notifications = [
    { id: '1', title: 'PM2 Process Restorted', message: 'worker-queue process restarted on Worker Queue & Cache node.', time: '12m ago', unread: true },
    { id: '2', title: 'Deployment Completed', message: 'Build #210 for Calo AI API successfully deployed to Production API Cluster 01.', time: '18m ago', unread: true },
    { id: '3', title: 'SSL Certificate Auto-Renewed', message: 'Certificate for api.calo.io was automatically renewed for 90 days.', time: '2h ago', unread: false },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Thông báo Hệ thống</h1>
            <p className="text-sm text-slate-500">
              Nhật ký thông báo sự cố, lịch trình tự động và kết quả deployment.
            </p>
          </div>

          <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5">
            <CheckCheck className="w-4 h-4 text-slate-600" />
            <span>Đánh dấu đã đọc tất cả</span>
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 rounded-xl border transition-colors flex items-start gap-3 ${n.unread ? 'bg-blue-50/50 border-blue-200/80' : 'bg-white border-slate-200/80'}`}>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="font-semibold text-slate-900">{n.title}</div>
                <p className="text-slate-600 mt-0.5">{n.message}</p>
                <div className="font-mono text-[11px] text-slate-400 mt-1">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
