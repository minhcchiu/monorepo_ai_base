'use client';

import { BellRing, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AlertItem } from '../types';
import { ROUTES } from '@/constants/routes';

interface RecentAlertsProps {
  alerts: AlertItem[];
}

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-sm text-slate-900">Recent Alerts</h3>
          </div>
          {unresolvedCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold text-xs">
              {unresolvedCount} Unresolved
            </span>
          )}
        </div>

        {/* List of Alerts */}
        <div className="flex flex-col gap-2.5">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/60 flex items-start gap-3"
            >
              <span
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alt.severity === 'critical'
                    ? 'bg-rose-500'
                    : alt.severity === 'warning'
                    ? 'bg-blue-600'
                    : 'bg-emerald-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-slate-900">{alt.title}</div>
                <p className="text-xs text-slate-500">{alt.message}</p>
                <div
                  className={`mt-1 font-mono text-[11px] ${
                    alt.severity === 'info' ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  Node: {alt.node} • {alt.timeAgo}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link */}
      <Link
        href={ROUTES.ALERTS}
        className="mt-4 pt-2 text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
      >
        <span>Configure alert rules</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
