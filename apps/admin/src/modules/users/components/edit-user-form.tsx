'use client';

import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/common/spinner';
import { updateUserSchema, type UpdateUserFormValues } from '../schema';
import { useUpdateUser } from '../hooks/use-users-mutation';
import type { User } from '../types';
import { USER_ROLES, ROLE_META } from '../roles';

interface EditUserFormProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function EditUserForm({ user, open, onClose }: EditUserFormProps) {
  const { mutate, isPending } = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        avatar: user.avatar ?? '',
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const onSubmit = (values: UpdateUserFormValues) => {
    if (!user) return;
    mutate({ id: user.id, payload: values }, { onSuccess: onClose });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa người dùng</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-firstName">Tên</Label>
              <Input id="edit-firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-lastName">Họ</Label>
              <Input id="edit-lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Số điện thoại</Label>
            <Input id="edit-phone" {...register('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-avatar">URL ảnh đại diện</Label>
            <Input id="edit-avatar" {...register('avatar')} />
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select
              value={watch('role')}
              onValueChange={(v) => setValue('role', v as UpdateUserFormValues['role'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select
              value={watch('status')}
              onValueChange={(v) => setValue('status', v as UpdateUserFormValues['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] as const).map((s) => (
                  <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={watch('isActive') ?? true}
              onCheckedChange={(v) => setValue('isActive', v)}
            />
            <Label>Đang hoạt động</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? <Spinner className="mr-2" /> : null}
              Lưu thay đổi
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
