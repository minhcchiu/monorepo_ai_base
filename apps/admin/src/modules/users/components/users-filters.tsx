'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilterCard } from '@/components/common/filter-card';
import { USER_ROLES, USER_STATUSES, ROLE_META, STATUS_META, type UserRole, type UserStatus } from '../roles';

const ROLES = USER_ROLES;
const STATUSES = USER_STATUSES;

const ROLE_LABELS = Object.fromEntries(
  USER_ROLES.map((r) => [r, ROLE_META[r].label]),
) as Record<UserRole, string>;

const STATUS_LABELS = Object.fromEntries(
  USER_STATUSES.map((s) => [s, STATUS_META[s].label]),
) as Record<UserStatus, string>;

interface UsersFiltersProps {
  total?: number;
  isLoading?: boolean;
}

export function UsersFilters({ total, isLoading }: UsersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  useEffect(() => {
    if (search === (searchParams.get('search') ?? '')) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pathname, router, searchParams]);

  const handleRoleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') params.delete('role');
      else params.set('role', value);
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') params.delete('status');
      else params.set('status', value);
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleReset = () => {
    setSearch('');
    router.push(pathname);
  };

  const hasFilters = search || searchParams.get('role') || searchParams.get('status');

  return (
    <FilterCard total={total} totalLabel="người dùng" isLoading={isLoading}>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder="Tìm tên, email, số điện thoại…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-[13px] bg-slate-50 border-slate-200 focus:bg-white"
        />
      </div>

      <Select value={searchParams.get('role') ?? 'all'} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-[140px] h-8 text-[13px] bg-slate-50 border-slate-200">
          <SelectValue placeholder="Tất cả vai trò" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả vai trò</SelectItem>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get('status') ?? 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[150px] h-8 text-[13px] bg-slate-50 border-slate-200">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 gap-1 text-[13px] text-slate-400 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" /> Xóa lọc
        </Button>
      )}
    </FilterCard>
  );
}
