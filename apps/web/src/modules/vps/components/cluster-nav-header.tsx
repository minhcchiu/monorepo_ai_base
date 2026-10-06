'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Server,
  Activity,
  Cpu,
  Folder,
  Rocket,
  Terminal,
  HardDrive,
  Clock,
  Globe,
  Archive,
  Sliders,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { VpsClusterDetail } from '../types';

interface ClusterNavHeaderProps {
  cluster: VpsClusterDetail;
}

export function ClusterNavHeader({ cluster }: ClusterNavHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: `/vps/${cluster.id}`, icon: Server },
    { label: 'Projects', href: `/vps/${cluster.id}/projects`, icon: Folder },
    { label: 'Deployments', href: `/vps/${cluster.id}/deployments`, icon: Rocket },
    { label: 'Monitoring', href: `/vps/${cluster.id}/monitoring`, icon: Activity },
    { label: 'PM2 Manager', href: `/vps/${cluster.id}/pm2`, icon: Cpu },
    { label: 'Logs', href: `/vps/${cluster.id}/logs`, icon: FileText },
    { label: 'Terminal', href: `/vps/${cluster.id}/terminal`, icon: Terminal },
    { label: 'File Manager', href: `/vps/${cluster.id}/files`, icon: HardDrive },
    { label: 'Cron Jobs', href: `/vps/${cluster.id}/cron`, icon: Clock },
    { label: 'Domains', href: `/vps/${cluster.id}/domains`, icon: Globe },
    { label: 'Backups', href: `/vps/${cluster.id}/backups`, icon: Archive },
    { label: 'Settings', href: `/vps/${cluster.id}/settings`, icon: Sliders },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link href="/vps" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Server className="w-3.5 h-3.5" />
            <span>VPS Instances</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold">{cluster.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{cluster.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{cluster.statusBadgeText}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-600 border border-slate-200/60">
              {cluster.regionCode}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
            <span>IP: <strong className="text-slate-900">{cluster.ip}</strong></span>
            <span>•</span>
            <span>OS: <strong className="text-slate-900">{cluster.os}</strong></span>
            <span>•</span>
            <span>Uptime: <strong className="text-emerald-700">{cluster.uptime}</strong></span>
          </div>
        </div>
      </div>

      {/* Secondary Tab Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {navItems.map((item) => {
            const active =
              item.href === `/vps/${cluster.id}`
                ? pathname === `/vps/${cluster.id}`
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
