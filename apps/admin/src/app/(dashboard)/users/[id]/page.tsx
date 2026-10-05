'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Mail, Phone, ShieldCheck, Calendar,
  Clock, CheckCircle2, XCircle,
  Hash, CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserById } from '@/modules/users/hooks/use-users';
import { EditUserForm } from '@/modules/users/components/edit-user-form';
import { PermissionGuard } from '@/components/common/permission-guard';
import { ROLE_META as ROLE_STYLES, STATUS_META as STATUS_STYLES } from '@/modules/users/roles';

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];
function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="p-1.5 rounded-md bg-slate-100 mt-0.5 shrink-0">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 leading-tight">{label}</p>
        <p className="text-[13px] font-medium text-slate-800 leading-tight mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading } = useUserById(id);
  const user = data?.data;
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <XCircle className="h-8 w-8 mb-2 text-slate-300" />
        <p className="text-[14px]">User not found.</p>
        <Button variant="link" asChild className="mt-1">
          <Link href="/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const avatarColor = getAvatarColor(user.id);
  const roleStyle = ROLE_STYLES[user.role];
  const statusStyle = user.status ? STATUS_STYLES[user.status] : undefined;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" asChild>
          <Link href="/users"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <span className="text-[13px] text-slate-400">Back to Users</span>
      </div>

      {/* Profile header card */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[#1e1b4b] via-[#14205a] to-[#1e1b4b]" />
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-8">
            <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
              {user.avatar && <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />}
              <AvatarFallback className={`text-[18px] font-bold bg-gradient-to-br ${avatarColor} text-white`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <PermissionGuard permission="users:update">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="mb-1 gap-1.5 h-8 text-[13px]"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </PermissionGuard>
          </div>
          <div className="mt-3">
            <h1 className="text-[18px] font-bold text-slate-800 leading-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-[13px] text-slate-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleStyle?.className ?? ''}`}>
                {roleStyle?.label ?? user.role}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle?.className ?? ''}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle?.dot ?? ''}`} />
                {statusStyle?.label ?? user.status}
              </span>
              {user.isActive ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-500">
                  <XCircle className="h-3.5 w-3.5" /> Inactive account
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm p-5">
        <h2 className="text-[13px] font-semibold text-slate-700 mb-1">Account Details</h2>
        <InfoRow icon={Mail} label="Email address" value={user.email} />
        <InfoRow icon={Phone} label="Phone number" value={user.phone ?? '—'} />
        <InfoRow icon={ShieldCheck} label="Role" value={user.role} />
        <InfoRow
          icon={Clock}
          label="Last login"
          value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
        />
        <InfoRow
          icon={Calendar}
          label="Account created"
          value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        />
        <InfoRow
          icon={CalendarClock}
          label="Last updated"
          value={new Date(user.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        />
        <InfoRow icon={Hash} label="User ID" value={<span className="font-mono break-all">{user.id}</span>} />
      </div>

      <EditUserForm user={user} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
