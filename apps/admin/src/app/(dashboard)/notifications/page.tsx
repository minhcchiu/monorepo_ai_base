'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, Send, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionGuard } from '@/components/common/permission-guard';
import { useNotifications } from '@/modules/notifications/hooks/use-notifications';
import { NotificationsTable } from '@/modules/notifications/components/notifications-table';
import { NotificationsFilters } from '@/modules/notifications/components/notifications-filters';
import { SendNotificationForm } from '@/modules/notifications/components/send-notification-form';
import { BroadcastNotificationForm } from '@/modules/notifications/components/broadcast-notification-form';
import { PageHeader } from '@/components/common/page-header';
import { PagePagination } from '@/components/common/page-pagination';
import type { NotificationType } from '@/modules/notifications/types';

const LIMIT = 10;

function NotificationsContent() {
  const searchParams = useSearchParams();
  const [sendOpen, setSendOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const page = Number(searchParams.get('page') ?? '1');
  const type = (searchParams.get('type') ?? undefined) as NotificationType | undefined;
  const isReadParam = searchParams.get('isRead');
  const isRead = isReadParam === 'true' ? true : isReadParam === 'false' ? false : undefined;

  const { data, isLoading, isError, refetch } = useNotifications({ page, limit: LIMIT, type, isRead });
  const notifications = data?.data?.data ?? [];
  const total = data?.data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <NotificationsFilters total={total} isLoading={isLoading} />
        <div className="flex gap-2 shrink-0">
          <PermissionGuard permission="notifications:send">
            <Button size="sm" onClick={() => setSendOpen(true)}
              className="gap-1.5 h-8 text-[13px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm">
              <Send className="h-3.5 w-3.5" /> Gửi thông báo
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="notifications:broadcast">
            <Button size="sm" variant="outline" onClick={() => setBroadcastOpen(true)} className="gap-1.5 h-8 text-[13px]">
              <Radio className="h-3.5 w-3.5" /> Broadcast
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <NotificationsTable data={notifications} isLoading={isLoading} isError={isError} onRetry={refetch} />
      {!isLoading && <PagePagination page={page} totalPages={totalPages} total={total} limit={LIMIT} />}

      <SendNotificationForm open={sendOpen} onClose={() => setSendOpen(false)} />
      <BroadcastNotificationForm open={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        icon={Bell}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        title="Notifications"
        description="Send and manage system notifications"
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <NotificationsContent />
      </Suspense>
    </div>
  );
}
