'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';
import { isAuthenticated, getStoredUser } from '@/lib/auth';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { ROUTES } from '@/constants/routes';
import { OverviewCards } from '@/modules/dashboard/components/overview-cards';
import { useDashboardOverview } from '@/modules/dashboard/hooks/use-dashboard';

const UserStatsChart = dynamic(
  () => import('@/modules/dashboard/components/user-stats-chart').then((m) => m.UserStatsChart),
  { ssr: false, loading: () => <div className="h-80 rounded-xl bg-slate-100 animate-pulse" /> }
);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
      <div>
        <h2 className="text-[14px] font-semibold text-slate-800 leading-tight">{title}</h2>
        {subtitle && <p className="text-[12px] text-slate-400 leading-tight">{subtitle}</p>}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data, isLoading, refetch, isFetching } = useDashboardOverview();
  const user = getStoredUser();
  const firstName = user?.firstName || 'Admin';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1e1b4b] via-[#14205a] to-[#1e1b4b] px-6 py-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTYgNnY2aDZ2LTZoLTZ6bTYgMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-indigo-500/10 to-transparent" />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-medium tracking-wide uppercase">
                System Online
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-white leading-tight">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-[13px] text-indigo-200/60 mt-0.5">{today}</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-[12px] font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div>
        <SectionHeader title="Overview" subtitle="Key metrics at a glance" />
        <OverviewCards data={data?.data} isLoading={isLoading} />
      </div>

      {/* User growth */}
      <div>
        <SectionHeader title="User Growth" subtitle="Registration trends by role" />
        <UserStatsChart />
      </div>
    </div>
  );
}

export default function DashboardPage() {
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

  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  );
}
