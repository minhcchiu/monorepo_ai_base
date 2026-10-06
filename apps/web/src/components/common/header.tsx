'use client';

import Link from 'next/link';
import { Search, Bell, Menu, User, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Trigger & Top Navigation */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-slate-500 hover:text-slate-800"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <nav className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/" className="text-blue-600 hover:underline">
            Console
          </Link>
          <Link href="/vps" className="text-slate-600 hover:text-slate-900 transition-colors">
            Clusters
          </Link>
          <Link href="/monitoring" className="text-slate-600 hover:text-slate-900 transition-colors">
            Telemetry
          </Link>
          <Link href="/settings" className="text-slate-600 hover:text-slate-900 transition-colors">
            API Keys
          </Link>
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Quick search clusters, nodes, IPs..."
            className="h-8 pl-8 pr-10 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-60"
          />
          <kbd className="absolute right-2 px-1 py-0.5 rounded bg-white text-[10px] font-mono text-slate-400 border border-slate-200 pointer-events-none">
            ⌘K
          </kbd>
        </div>

        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </Button>
        </Link>

        <Link href="/vps/add">
          <Button size="sm" className="h-8 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add VPS</span>
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                  MN
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/users" className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Profile & Members
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
