'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterCard } from '@/components/common/filter-card';

const NOTIFICATION_TYPES = [
  { value: 'SYSTEM_ANNOUNCEMENT',  label: 'Thông báo hệ thống' },
  { value: 'GENERAL',              label: 'Chung' },
] as const;

interface NotificationsFiltersProps {
  total?: number;
  isLoading?: boolean;
}

export function NotificationsFilters({ total, isLoading }: NotificationsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(key); else params.set(key, value);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const hasFilters = searchParams.get('type') || searchParams.get('isRead');

  return (
    <FilterCard total={total} totalLabel="thông báo" isLoading={isLoading}>
      <Select value={searchParams.get('type') ?? 'all'} onValueChange={(v) => setParam('type', v)}>
        <SelectTrigger className="w-[190px] h-8 text-[13px] bg-slate-50 border-slate-200">
          <SelectValue placeholder="Tất cả loại" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả loại</SelectItem>
          {NOTIFICATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={searchParams.get('isRead') ?? 'all'} onValueChange={(v) => setParam('isRead', v)}>
        <SelectTrigger className="w-[120px] h-8 text-[13px] bg-slate-50 border-slate-200">
          <SelectValue placeholder="Trạng thái đọc" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="false">Chưa đọc</SelectItem>
          <SelectItem value="true">Đã đọc</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)} className="h-8 gap-1 text-[13px] text-slate-400 hover:text-slate-700">
          <X className="h-3.5 w-3.5" /> Xóa lọc
        </Button>
      )}
    </FilterCard>
  );
}
