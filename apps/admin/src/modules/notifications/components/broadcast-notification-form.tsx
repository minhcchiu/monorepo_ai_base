'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/common/spinner';
import {
  broadcastNotificationSchema,
  type BroadcastNotificationFormValues,
} from '../schema';
import { useBroadcastNotification } from '../hooks/use-notifications-mutation';
import { BROADCAST_ROLES, type TargetUserRole } from '../types';

const NOTIFICATION_TYPES = [
  { value: 'SYSTEM_ANNOUNCEMENT', label: 'Thông báo hệ thống' },
  { value: 'GENERAL', label: 'Chung' },
] as const;

const ROLE_LABELS: Record<TargetUserRole, string> = {
  USER: 'Người dùng',
  MODERATOR: 'Điều phối',
  ADMIN: 'Quản trị',
};

interface BroadcastNotificationFormProps {
  open: boolean;
  onClose: () => void;
}

export function BroadcastNotificationForm({ open, onClose }: BroadcastNotificationFormProps) {
  const { mutate, isPending } = useBroadcastNotification();
  const [sentCount, setSentCount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BroadcastNotificationFormValues>({
    resolver: zodResolver(broadcastNotificationSchema),
    defaultValues: {
      type: 'SYSTEM_ANNOUNCEMENT',
      roles: [],
      excludeAdmin: false,
    },
  });

  const selectedRoles = watch('roles') ?? [];
  const excludeAdmin = watch('excludeAdmin') ?? false;

  useEffect(() => {
    if (!open) {
      reset();
      setSentCount(null);
    }
  }, [open, reset]);

  const toggleRole = (role: TargetUserRole) => {
    if (selectedRoles.includes(role)) {
      setValue(
        'roles',
        selectedRoles.filter((r) => r !== role)
      );
    } else {
      setValue('roles', [...selectedRoles, role]);
    }
  };

  const onSubmit = (values: BroadcastNotificationFormValues) => {
    mutate(values, {
      onSuccess: (res) => {
        setSentCount(res.data?.sentCount ?? null);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gửi thông báo đại trà</SheetTitle>
        </SheetHeader>

        {sentCount !== null && (
          <Card className="mt-4 border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-3">
              <p className="text-sm font-medium text-green-700">
                Đã gửi thông báo tới <span className="font-bold">{sentCount}</span> người nhận.
              </p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Vai trò nhận (để trống = tất cả)</Label>
            <div className="grid grid-cols-2 gap-2">
              {BROADCAST_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 accent-primary"
              checked={excludeAdmin}
              onChange={(e) => setValue('excludeAdmin', e.target.checked)}
            />
            Loại trừ người dùng Admin
          </label>

          <div className="space-y-1.5">
            <Label>Loại thông báo</Label>
            <Select
              defaultValue="SYSTEM_ANNOUNCEMENT"
              onValueChange={(v) =>
                setValue('type', v as BroadcastNotificationFormValues['type'])
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
            <Label htmlFor="bc-title">Tiêu đề *</Label>
            <Input id="bc-title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-message">Nội dung *</Label>
            <Textarea id="bc-message" rows={4} {...register('message')} />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? <Spinner className="mr-2" /> : null}
              Gửi đại trà
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
