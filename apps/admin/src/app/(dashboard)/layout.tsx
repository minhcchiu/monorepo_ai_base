'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { ROUTES } from '@/constants/routes';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(ROUTES.LOGIN);
    } else {
      // eslint-disable-next-line
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return <DashboardShell>{children}</DashboardShell>;
}
