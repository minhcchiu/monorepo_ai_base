'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/common/spinner';
import { useUsers } from '@/modules/users/hooks/use-users';
import type { User } from '@/modules/users/types';
import { sendNotificationSchema, type SendNotificationFormValues } from '../schema';
import {
  useSendManyNotifications,
  useSendUserNotification,
} from '../hooks/use-notifications-mutation';

const NOTIFICATION_TYPES = [
  { value: 'SYSTEM_ANNOUNCEMENT', label: 'Thông báo hệ thống' },
  { value: 'GENERAL', label: 'Chung' },
] as const;

const EMPTY_VALUES: SendNotificationFormValues = {
  userIds: [],
  type: 'SYSTEM_ANNOUNCEMENT',
  title: '',
  message: '',
};

const fullName = (user: User) => `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

interface SendNotificationFormProps {
  open: boolean;
  onClose: () => void;
}

export function SendNotificationForm({ open, onClose }: SendNotificationFormProps) {
  const { mutate: sendOne, isPending: isSendingOne } = useSendUserNotification();
  const { mutate: sendMany, isPending: isSendingMany } = useSendManyNotifications();
  const isPending = isSendingOne || isSendingMany;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Giữ thông tin người đã chọn để vẫn hiển thị tên khi họ rơi ra ngoài kết quả tìm kiếm.
  const [selected, setSelected] = useState<User[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useUsers({
    page: 1,
    limit: 20,
    search: debouncedSearch || undefined,
  });
  const users = useMemo(() => data?.data?.data ?? [], [data]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SendNotificationFormValues>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: EMPTY_VALUES,
  });

  const userIds = watch('userIds');

  useEffect(() => {
    if (open) return;
    reset(EMPTY_VALUES);
    setSelected([]);
    setSearch('');
  }, [open, reset]);

  const toggleUser = (user: User) => {
    const next = userIds.includes(user.id)
      ? selected.filter((item) => item.id !== user.id)
      : [...selected, user];
    setSelected(next);
    setValue(
      'userIds',
      next.map((item) => item.id),
      { shouldValidate: true },
    );
  };

  const onSubmit = (values: SendNotificationFormValues) => {
    const base = { type: values.type, title: values.title, message: values.message };
    if (values.userIds.length === 1) {
      sendOne({ ...base, userId: values.userIds[0] }, { onSuccess: onClose });
      return;
    }
    sendMany({ ...base, userIds: values.userIds }, { onSuccess: onClose });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && !isPending && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gửi thông báo</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="notification-recipients">Người nhận *</Label>
            <Input
              id="notification-recipients"
              placeholder="Tìm theo tên hoặc email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selected.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[12px] text-blue-700"
                  >
                    {fullName(user)}
                    <button
                      type="button"
                      onClick={() => toggleUser(user)}
                      className="text-blue-400 hover:text-blue-700"
                      aria-label={`Bỏ chọn ${fullName(user)}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
              {isLoading && <p className="p-3 text-[12px] text-slate-400">Đang tải người dùng…</p>}
              {!isLoading && users.length === 0 && (
                <p className="p-3 text-[12px] text-slate-400">Không tìm thấy người dùng.</p>
              )}
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                    checked={userIds.includes(user.id)}
                    onChange={() => toggleUser(user)}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-800">{fullName(user)}</span>
                    <span className="block text-[11px] text-slate-400">{user.email}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.userIds && (
              <p className="text-sm text-destructive">{errors.userIds.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Loại thông báo</Label>
            <Select
              defaultValue="SYSTEM_ANNOUNCEMENT"
              onValueChange={(v) =>
                setValue('type', v as SendNotificationFormValues['type'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Nội dung *</Label>
            <Textarea id="message" rows={4} {...register('message')} />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? <Spinner className="mr-2" /> : null}
              {userIds.length > 1 ? `Gửi cho ${userIds.length} người` : 'Gửi'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Hủy
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
