'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStats } from '../hooks/use-dashboard';
import type { GroupBy } from '../types';
import { ROLE_META } from '@/modules/users/roles';

const ROLE_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_META).map(([role, meta]) => [role, meta.color]),
);

function defaultRange(groupBy: GroupBy) {
  const to = new Date();
  const from = new Date(to);
  if (groupBy === 'DAY') from.setDate(from.getDate() - 30);
  else if (groupBy === 'WEEK') from.setDate(from.getDate() - 84);
  else from.setFullYear(from.getFullYear() - 1);
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

export function UserStatsChart() {
  const [groupBy, setGroupBy] = useState<GroupBy>('MONTH');
  const range = useMemo(() => defaultRange(groupBy), [groupBy]);
  const { data: res, isLoading } = useUserStats({ groupBy, ...range });
  const stats = res?.data;

  const chartData = useMemo(
    () =>
      (stats?.series ?? []).map((point) => ({
        label: point.label,
        ...point.byRole,
      })),
    [stats?.series]
  );

  return (
    <Card className="shadow-none ring-0 border border-slate-200/80">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[14px] font-semibold text-slate-800">Người dùng mới</CardTitle>
            <p className="text-[12px] text-slate-400 mt-0.5">Đăng ký mới theo vai trò</p>
          </div>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAY">Ngày</SelectItem>
              <SelectItem value="WEEK">Tuần</SelectItem>
              <SelectItem value="MONTH">Tháng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                {Object.entries(ROLE_COLORS).map(([role, color]) => (
                  <Line key={role} type="monotone" dataKey={role} stroke={color} dot={false} strokeWidth={2.5} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {stats?.summary && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-[12px] text-slate-500">Tổng người dùng mới: </span>
                  <span className="text-[12px] font-semibold text-slate-800">
                    {stats.summary.totalNewUsers.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-[12px] text-slate-500">Tăng trưởng tháng này: </span>
                  <span className="text-[12px] font-semibold text-indigo-600">
                    {stats.summary.growthRateThisMonth.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
