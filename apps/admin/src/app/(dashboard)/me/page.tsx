'use client';

import { Shield, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UpdateProfileForm } from '@/modules/admin/components/update-profile-form';
import { ChangePasswordForm } from '@/modules/admin/components/change-password-form';
import { getStoredUser } from '@/lib/auth';

export default function MePage() {
  const user = getStoredUser();
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin';
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'A'
    : 'A';

  return (
    <div className="space-y-5 max-w-xl">
      {/* Profile header card */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#1e1b4b] via-[#14205a] to-[#1e1b4b]" />
        <div className="px-6 pb-5">
          <div className="-mt-10">
            <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
              <AvatarFallback className="text-[18px] font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-3">
            <h1 className="text-[18px] font-bold text-slate-800 leading-tight">{displayName}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-[12px] text-slate-500">
              {user?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {user.email}
                </span>
              )}
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {user.phone}
                </span>
              )}
              {user?.role && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  <Shield className="h-3 w-3" /> {user.role}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800 leading-tight">Profile Information</h2>
          <p className="text-[12px] text-slate-400 leading-tight">Update your account details</p>
        </div>
      </div>
      <UpdateProfileForm />

      <div className="flex items-center gap-2">
        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-red-400 to-rose-500" />
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800 leading-tight">Security</h2>
          <p className="text-[12px] text-slate-400 leading-tight">Change your password</p>
        </div>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
