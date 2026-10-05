'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/spinner';
import { updateProfileSchema, type UpdateProfileFormValues } from '../schema';
import { useUpdateProfile } from '../hooks/use-admin-mutation';
import { getStoredUser } from '@/lib/auth';

export function UpdateProfileForm() {
  const { mutate, isPending } = useUpdateProfile();
  const user = getStoredUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({ resolver: zodResolver(updateProfileSchema) });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        avatar: user.avatar ?? '',
      });
    }
  }, [reset]);

  const onSubmit = (values: UpdateProfileFormValues) => {
    const payload: UpdateProfileFormValues = {};
    if (values.firstName?.trim()) payload.firstName = values.firstName.trim();
    if (values.lastName?.trim()) payload.lastName = values.lastName.trim();
    if (values.phone?.trim()) payload.phone = values.phone.trim();
    if (values.avatar?.trim()) payload.avatar = values.avatar.trim();
    mutate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thông tin hồ sơ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-first">Tên</Label>
              <Input id="p-first" {...register('firstName')} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-last">Họ</Label>
              <Input id="p-last" {...register('lastName')} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Số điện thoại</Label>
            <Input id="p-phone" {...register('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-avatar">URL ảnh đại diện</Label>
            <Input id="p-avatar" {...register('avatar')} />
            {errors.avatar && <p className="text-sm text-destructive">{errors.avatar.message}</p>}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner className="mr-2" /> : null}
            Cập nhật hồ sơ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
