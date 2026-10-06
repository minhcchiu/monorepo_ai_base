'use client';

import { Rocket, CheckCircle2, Loader2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DeploymentItem } from '../types';
import { ROUTES } from '@/constants/routes';

interface RecentDeploymentsProps {
  deployments: DeploymentItem[];
}

export function RecentDeployments({ deployments }: RecentDeploymentsProps) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm text-slate-900">Recent Deployments</h3>
          </div>
          <span className="font-mono text-xs text-slate-500">CI/CD Sync</span>
        </div>

        {/* List of Deployments */}
        <div className="flex flex-col gap-2.5">
          {deployments.map((dep) => (
            <div
              key={dep.id}
              className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/60 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {dep.status === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                )}
                {dep.status === 'running' && (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-0.5 shrink-0" />
                )}
                {dep.status === 'failed' && (
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                )}

                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{dep.name}</div>
                  <div className="text-xs text-slate-500 truncate">{dep.target}</div>
                </div>
              </div>

              <span
                className={`font-mono text-[11px] shrink-0 ${
                  dep.status === 'running' ? 'text-blue-600 font-medium' : 'text-slate-500'
                }`}
              >
                {dep.timeAgo}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link */}
      <Link
        href={ROUTES.DEPLOYMENTS}
        className="mt-4 pt-2 text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
      >
        <span>View all pipeline history</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
