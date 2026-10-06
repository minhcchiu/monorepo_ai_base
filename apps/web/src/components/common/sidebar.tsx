'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Folder,
  Rocket,
  Activity,
  BellRing,
  Archive,
  History,
  Sliders,
  Users,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'INFRASTRUCTURE',
    items: [
      { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
      { label: 'VPS', href: ROUTES.VPS, icon: Server },
      { label: 'Projects', href: ROUTES.PROJECTS, icon: Folder },
      { label: 'Deployments', href: ROUTES.DEPLOYMENTS, icon: Rocket },
      { label: 'Monitoring', href: ROUTES.MONITORING, icon: Activity },
      { label: 'Alerts', href: ROUTES.ALERTS, icon: BellRing },
      { label: 'Backups', href: ROUTES.BACKUPS, icon: Archive },
      { label: 'Activity Logs', href: ROUTES.ACTIVITY_LOGS, icon: History },
      { label: 'Settings', href: ROUTES.SETTINGS, icon: Sliders },
    ],
  },
  {
    label: 'QUẢN TRỊ SYSTEM',
    items: [
      { label: 'Người dùng', href: ROUTES.USERS, icon: Users },
      { label: 'Thông báo', href: ROUTES.NOTIFICATIONS, icon: Bell },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/infrastructure' : pathname.startsWith(href);

  return (
    <aside className="flex flex-col h-full bg-[#0b1c30] text-slate-100 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <Server className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">CloudPulse</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700/60">
            v2.5
          </span>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="p-3 border-b border-slate-800/80 shrink-0">
        <button
          type="button"
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-semibold shrink-0">
              MI
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">Minh Infrastructure</div>
              <div className="font-mono text-[10px] text-slate-400 truncate">Prod Cloud • 12 Nodes</div>
            </div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-2 py-2 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400/80">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      active
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status & User Menu */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0">
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/50 flex items-center justify-between border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-300">All Systems Normal</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">99.98%</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex items-center gap-2.5 w-full p-2 rounded-lg transition-all hover:bg-slate-800/80 text-left"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-blue-600 text-white">
                  MN
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate leading-tight">
                  Minh Nguyễn
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight capitalize">
                  DevOps Lead
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48 mb-1 bg-white">
            <DropdownMenuItem className="cursor-pointer">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-rose-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
