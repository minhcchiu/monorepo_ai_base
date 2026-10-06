'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface InfrastructureHeaderProps {
  onAddVpsClick?: () => void;
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
}

export function InfrastructureHeader({
  onAddVpsClick,
  onSearchChange,
  searchTerm = '',
}: InfrastructureHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200/60">
            Global Scope
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Overview of all infrastructure nodes, health metrics, and cluster runtime activity.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex items-center hidden md:flex">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-9 pl-9 pr-3 text-xs w-48 lg:w-56"
            placeholder="Filter node or service..."
          />
        </div>
      </div>
    </div>
  );
}
