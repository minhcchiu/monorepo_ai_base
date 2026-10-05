'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/data-table';
import { PermissionGuard } from '@/components/common/permission-guard';
import { DeleteNotificationDialog } from './delete-notification-dialog';
import type { Notification } from '../types';

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  SYSTEM_ANNOUNCEMENT: { label: 'Hệ thống', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  GENERAL:             { label: 'Chung',    className: 'bg-slate-50 text-slate-700 border-slate-200' },
};

interface NotificationsTableProps {
  data: Notification[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function NotificationsTable({ data, isLoading, isError, onRetry }: NotificationsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  const columns: ColumnDef<Notification>[] = [
    {
      id: 'recipient',
      header: 'Người nhận',
      // `GET /admin/notifications` join kèm người nhận; thiếu `user` thì lùi về id rút gọn.
      cell: ({ row }) => {
        const { user, userId } = row.original;
        if (!user) {
          return <span className="text-[12px] font-mono text-slate-500">{userId.slice(0, 8)}…</span>;
        }
        const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        return (
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-slate-800">{fullName || user.email}</span>
            <span className="text-[11px] text-slate-400">{user.phone || user.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ getValue }) => {
        const t = getValue() as string;
        const style = TYPE_STYLES[t];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${style?.className ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {style?.label ?? t.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'title',
      header: 'Tiêu đề',
      cell: ({ getValue }) => <span className="text-[13px] font-semibold text-slate-800">{getValue() as string}</span>,
    },
    {
      accessorKey: 'message',
      header: 'Nội dung',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-slate-500 line-clamp-2 max-w-[200px] block">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'isRead',
      header: 'Đọc',
      cell: ({ getValue }) => {
        const read = getValue() as boolean;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${read ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${read ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {read ? 'Đã đọc' : 'Chưa đọc'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Gửi lúc',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-slate-400">
          {new Date(getValue() as string).toLocaleString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <PermissionGuard permission="notifications:delete">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(row.original)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </PermissionGuard>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 rounded-xl border border-slate-200 bg-white">
        <p className="text-[13px]">Không thể tải danh sách thông báo.</p>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry} className="text-[13px]">Thử lại</Button>}
      </div>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={data} isLoading={isLoading} emptyMessage="Không có thông báo nào." />
      <DeleteNotificationDialog notification={deleteTarget} open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
