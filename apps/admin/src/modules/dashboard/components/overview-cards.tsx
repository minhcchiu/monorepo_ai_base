'use client';

import { Users, UserCheck, Bell, BellDot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '../hooks/use-dashboard';
import type { DashboardOverview, DashboardSummary } from '../types';

interface OverviewCardsProps {
  /** Giữ tương thích với trang dashboard hiện có — thẻ tổng quan tự lấy dữ liệu từ API summary. */
  data?: DashboardOverview;
  /** Trạng thái tải của trang cha; gộp với trạng thái tải của chính thẻ tổng quan. */
  isLoading?: boolean;
}

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const cards = [
  {
    key: 'users' as const,
    label: 'Người dùng',
    sub: 'Tổng tài khoản chưa xoá',
    icon: Users,
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-400/20',
    shadowColor: 'shadow-blue-500/20',
    getValue: (d: DashboardSummary) => formatNumber(d.totalUsers),
  },
  {
    key: 'activeUsers' as const,
    label: 'Đang hoạt động',
    sub: 'Tài khoản còn hiệu lực',
    icon: UserCheck,
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-400/20',
    shadowColor: 'shadow-emerald-500/20',
    getValue: (d: DashboardSummary) => formatNumber(d.activeUsers),
  },
  {
    key: 'notifications' as const,
    label: 'Thông báo',
    sub: 'Tổng thông báo đã gửi',
    icon: Bell,
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-400/20',
    shadowColor: 'shadow-violet-500/20',
    getValue: (d: DashboardSummary) => formatNumber(d.totalNotifications),
  },
  {
    key: 'unreadNotifications' as const,
    label: 'Chưa đọc',
    sub: 'Thông báo người dùng chưa xem',
    icon: BellDot,
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-400/20',
    shadowColor: 'shadow-amber-500/20',
    getValue: (d: DashboardSummary) => formatNumber(d.unreadNotifications),
  },
  {
    key: 'settings' as const,
    label: 'Cấu hình hệ thống',
    sub: 'Số bản ghi SystemSetting',
    icon: Settings,
    gradient: 'from-sky-500 to-cyan-600',
    iconBg: 'bg-sky-400/20',
    shadowColor: 'shadow-sky-500/20',
    getValue: (d: DashboardSummary) => formatNumber(d.totalSettings),
  },
];

const GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

export function OverviewCards({ isLoading: isParentLoading = false }: OverviewCardsProps) {
  const { data, isLoading, isError, refetch } = useDashboardSummary();
  const summary = data?.data;

  if (isLoading || isParentLoading) {
    return (
      <div className={GRID_CLASS}>
        {cards.map((card) => (
          <Skeleton key={card.key} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-3 text-slate-400 rounded-xl border border-slate-200 bg-white">
        <p className="text-[13px]">Không thể tải số liệu tổng quan.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-[13px]">
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className={GRID_CLASS}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg ${card.shadowColor} text-white`}
          >
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
            <div className="absolute -right-2 -bottom-6 h-16 w-16 rounded-full bg-white/5" />

            <div className="relative">
              <div className={`inline-flex p-2 rounded-lg ${card.iconBg} backdrop-blur-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>

              <p className="mt-3 text-[28px] font-bold leading-none tracking-tight">
                {card.getValue(summary)}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-white/80 leading-tight">
                {card.label}
              </p>
              <p className="mt-1 text-[11px] text-white/50 leading-tight">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
