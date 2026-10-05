'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStoredUser, removeToken } from '@/lib/auth';
import { ROUTES } from '@/constants/routes';

const PAGE_META: Record<string, { title: string; breadcrumb: string }> = {
  [ROUTES.DASHBOARD]: { title: 'Tổng quan', breadcrumb: 'Admin / Tổng quan' },
  [ROUTES.USERS]: { title: 'Người dùng', breadcrumb: 'Admin / Người dùng' },
  [ROUTES.ROLES]: { title: 'Vai trò', breadcrumb: 'Admin / Vai trò' },
  '/settings': { title: 'Cài đặt', breadcrumb: 'Admin / Cài đặt' },
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  const pageMeta = PAGE_META[pathname] ?? { title: 'Tổng quan', breadcrumb: 'Admin' };
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin';
  const userInitials =
    user
      ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
      : 'U';

  const handleLogout = () => {
    removeToken();
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-white border-b border-slate-200/80 shrink-0 sticky top-0 z-10 shadow-sm">
      {/* Left: mobile trigger + page title */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">
            {pageMeta.title}
          </h1>
          <p className="text-[11px] text-slate-400 leading-tight">{pageMeta.breadcrumb}</p>
        </div>
      </div>

      {/* Right: actions + user menu */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
        </Button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8 px-2 text-slate-700 hover:bg-slate-100"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] font-semibold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 mt-1">
            <DropdownMenuLabel className="font-normal py-2">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
    </header>
  );
}
