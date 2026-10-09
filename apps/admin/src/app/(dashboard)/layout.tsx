'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { ROUTES } from '@/constants/routes';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(ROUTES.LOGIN);
    }
  }, [router]);

  return <DashboardShell>{children}</DashboardShell>;
}
