'use client';

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
import { useDeleteNotification } from '../hooks/use-notifications-mutation';
import type { Notification } from '../types';

interface DeleteNotificationDialogProps {
  notification: Notification | null;
  open: boolean;
  onClose: () => void;
}

export function DeleteNotificationDialog({
  notification,
  open,
  onClose,
}: DeleteNotificationDialogProps) {
  const { mutate, isPending } = useDeleteNotification();

  const handleConfirm = () => {
    if (!notification) return;
    mutate(notification.id, { onSuccess: onClose });
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa thông báo</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa thông báo{' '}
            <span className="font-medium">&ldquo;{notification?.title}&rdquo;</span>?
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? <Spinner className="mr-2" /> : null}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
