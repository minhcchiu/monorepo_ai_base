'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Check } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/modules/auth/schema';
import { useLogin } from '@/modules/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/spinner';
import { isAuthenticated } from '@/lib/auth';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

const FEATURES = [
  'Phân quyền theo vai trò',
  'Giám sát hoạt động thời gian thực',
  'Nhật ký bảo mật',
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { mutate: loginFn, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginFn(values);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e1b4b] via-[#1a2560] to-[#0a1628] flex-col justify-center items-center px-12 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-grid-white" />

        <div className="relative z-10 max-w-sm w-full">
          {/* App icon */}
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
            <span className="text-white font-bold text-2xl">C</span>
          </div>

          <h1 className="text-[28px] font-bold text-white mb-2 leading-tight">PP00 Base Admin</h1>
          <p className="text-[14px] text-zinc-400 mb-8">Quản lý mọi thứ trong một nơi</p>

          <ul className="space-y-3 mb-12">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-blue-400" />
                </div>
                <span className="text-[13px] text-zinc-400">{feature}</span>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-zinc-600 tracking-widest uppercase">
            v2.0 — Bảng điều khiển doanh nghiệp
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Label */}
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-blue-500 mb-6">
            Bảng quản trị
          </p>

          <h2 className="text-[22px] font-bold text-slate-900 mb-1 leading-tight">
            Chào mừng trở lại
          </h2>
          <p className="text-[13px] text-slate-500 mb-7">Đăng nhập vào tài khoản quản trị</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium text-slate-700">
                Địa chỉ email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className={cn(
                  'h-10 text-sm border-slate-200 focus-visible:ring-blue-500',
                  errors.email && 'border-red-400 focus-visible:ring-red-400'
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[12px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[12px] font-medium text-slate-700">
                  Mật khẩu
                </Label>
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-[12px] font-medium text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className={cn(
                    'h-10 text-sm border-slate-200 focus-visible:ring-blue-500 pr-10',
                    errors.password && 'border-red-400 focus-visible:ring-red-400'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-[14px] font-medium transition-all shadow-[0_2px_8px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_12px_rgba(99,102,241,0.45)]"
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
