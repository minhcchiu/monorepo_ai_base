'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Lock, LockOpen, Pencil, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/common/spinner';
import { DataTable } from '@/components/tables/data-table';
import { PermissionGuard } from '@/components/common/permission-guard';
import { CreateUserForm } from './create-user-form';
import { EditUserForm } from './edit-user-form';
import { DeleteUserDialog } from './delete-user-dialog';
import { useToggleUserStatus } from '../hooks/use-users-mutation';
import type { User, UserRole, UserStatus } from '../types';
import { ROLE_META as ROLE_STYLES, STATUS_META as STATUS_STYLES } from '../roles';

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface UsersTableProps {
  data: User[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function UsersTable({ data, isLoading, isError, onRetry }: UsersTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const { mutate: toggleStatus, isPending: isToggling } = useToggleUserStatus();

  const isSuspended = toggleUser?.status === 'SUSPENDED';

  const handleConfirmToggle = () => {
    if (!toggleUser) return;
    toggleStatus(toggleUser.id, { onSuccess: () => setToggleUser(null) });
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Người dùng',
      cell: ({ row }) => {
        const u = row.original;
        const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?';
        const color = getAvatarColor(u.id);
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className={`text-[11px] font-semibold bg-gradient-to-br ${color} text-white`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight truncate">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Điện thoại',
      cell: ({ getValue }) => (
        <span className="text-[13px] text-slate-600">{(getValue() as string) || '—'}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Vai trò',
      cell: ({ getValue }) => {
        const role = getValue() as UserRole;
        const style = ROLE_STYLES[role];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${style?.className ?? ''}`}>
            {style?.label ?? role}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const status = getValue() as UserStatus;
        const style = STATUS_STYLES[status];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${style?.className ?? ''}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style?.dot ?? 'bg-slate-400'}`} />
            {style?.label ?? status}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-slate-400">
          {new Date(getValue() as string).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => router.push(`/users/${u.id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <PermissionGuard permission="users:update">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                onClick={() => setEditUser(u)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="users:update">
              <Button
                size="icon"
                variant="ghost"
                aria-label={u.status === 'SUSPENDED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                title={u.status === 'SUSPENDED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                className={
                  u.status === 'SUSPENDED'
                    ? 'h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    : 'h-7 w-7 text-slate-400 hover:text-orange-600 hover:bg-orange-50'
                }
                onClick={() => setToggleUser(u)}
              >
                {u.status === 'SUSPENDED' ? (
                  <LockOpen className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="users:delete">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => setDeleteUser(u)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </PermissionGuard>
          </div>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 rounded-xl border border-slate-200 bg-white">
        <p className="text-[13px]">Không thể tải danh sách người dùng.</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="text-[13px]">
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <PermissionGuard permission="users:create">
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 h-8 text-[13px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Thêm người dùng
          </Button>
        </PermissionGuard>
      </div>
      <DataTable columns={columns} data={data} isLoading={isLoading} emptyMessage="Không có người dùng nào." />
      <CreateUserForm open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserForm user={editUser} open={Boolean(editUser)} onClose={() => setEditUser(null)} />
      <DeleteUserDialog user={deleteUser} open={Boolean(deleteUser)} onClose={() => setDeleteUser(null)} />
      <AlertDialog
        open={Boolean(toggleUser)}
        onOpenChange={(v) => !v && !isToggling && setToggleUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn {isSuspended ? 'mở khóa' : 'khóa'} tài khoản{' '}
              <span className="font-medium">
                {toggleUser?.firstName} {toggleUser?.lastName}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle} disabled={isToggling}>
              {isToggling ? <Spinner className="mr-2" /> : null}
              {isSuspended ? 'Mở khóa' : 'Khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
