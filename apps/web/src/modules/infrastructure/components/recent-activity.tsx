'use client';

import { History, Key, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ActivityItem } from '../types';
import { ROUTES } from '@/constants/routes';

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-sm text-slate-900">Recent Activity</h3>
          </div>
          <span className="font-mono text-xs text-slate-500">Audit Stream</span>
        </div>

        {/* List of Activities */}
        <div className="flex flex-col gap-2.5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/60 flex items-start gap-3"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  act.type === 'deploy'
                    ? 'bg-blue-100 text-blue-800'
                    : act.type === 'pm2'
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {act.type === 'system' ? (
                  <Key className="w-3.5 h-3.5" />
                ) : (
                  act.userInitials
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-900">
                  <span className="font-semibold">{act.userName}</span> {act.actionText}
                </div>
                <span className="font-mono text-[11px] text-slate-500">{act.detailText}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link */}
      <Link
        href={ROUTES.ACTIVITY_LOGS}
        className="mt-4 pt-2 text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
      >
        <span>Full audit log archive</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
