'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bell,
  ChevronDown,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { removeToken, getStoredUser } from '@/lib/auth';
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
    label: 'MENU CHÍNH',
    items: [
      { label: 'Tổng quan', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
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
  const router = useRouter();
  const user = getStoredUser();

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin';
  const userInitials =
    user
      ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
      : 'U';
  const userRole = user?.role ?? 'Admin';

  const handleLogout = () => {
    removeToken();
    router.push(ROUTES.LOGIN);
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="flex flex-col h-full bg-gradient-to-b from-[#1e1b4b] via-[#14205a] to-[#0a1628] border-r border-white/10">
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-white/10">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.5)]">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="font-semibold text-sm text-white">Admin</span>
      </div>

      <div className="flex-1 px-2 py-2 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase text-indigo-300/50">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex items-center gap-[10px] px-3 py-2 rounded-md text-[13px] font-medium transition-all',
                    active
                      ? 'text-white bg-gradient-to-r from-white/[0.15] to-white/[0.04]'
                      : 'text-indigo-200/70 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-gradient-to-b from-blue-300 to-indigo-400 rounded-r" />
                  )}
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-blue-300' : 'text-indigo-300/60 group-hover:text-white'
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="px-2 py-3 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2.5 w-full px-3 py-2 rounded-md transition-all hover:bg-white/[0.08] text-left">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[11px] font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-indigo-200/50 truncate leading-tight capitalize">
                  {userRole}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-300/40 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48 mb-1">
            <DropdownMenuItem asChild>
              <Link href={ROUTES.ME} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Hồ sơ của tôi
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
