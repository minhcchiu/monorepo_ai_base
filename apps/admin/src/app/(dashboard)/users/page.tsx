'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useUsers } from '@/modules/users/hooks/use-users';
import { UsersTable } from '@/modules/users/components/users-table';
import { UsersFilters } from '@/modules/users/components/users-filters';
import type { UserRole, UserStatus } from '@/modules/users/types';

function UsersContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const limit = 10;
  const search = searchParams.get('search') ?? undefined;
  const role = (searchParams.get('role') ?? undefined) as UserRole | undefined;
  const status = (searchParams.get('status') ?? undefined) as UserStatus | undefined;

  const { data, isLoading, isError, refetch } = useUsers({ page, limit, search, role, status });
  const users = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const total = meta?.total ?? 0;
  // Ưu tiên `meta.totalPages` từ API; fallback tính từ total khi backend chưa trả field này.
  const totalPages = Math.max(1, meta?.totalPages ?? Math.ceil(total / limit));

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    window.history.pushState(null, '', `?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <UsersFilters total={total} isLoading={isLoading} />
      <UsersTable data={users} isLoading={isLoading} isError={isError} onRetry={refetch} />
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-slate-500">
            Showing <span className="font-medium text-slate-700">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> users
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => goTo(p)}
                >
                  {p}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="text-slate-400 text-sm px-1">…</span>}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => goTo(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-slate-800 leading-tight">Users</h1>
          <p className="text-[12px] text-slate-400 leading-tight">Manage system users and their roles</p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <UsersContent />
      </Suspense>
    </div>
  );
}
