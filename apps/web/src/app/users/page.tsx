'use client';

import { DashboardShell } from '@/components/common/dashboard-shell';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  const usersList = [
    { id: '1', name: 'Minh Nguyễn', email: 'minh.nguyen@cloudpulse.io', role: 'DevOps Lead', status: 'Active', lastActive: 'Now' },
    { id: '2', name: 'Tuấn Lê', email: 'tuan.le@cloudpulse.io', role: 'Senior Infrastructure Engineer', status: 'Active', lastActive: '18m ago' },
    { id: '3', name: 'Hoàng Phạm', email: 'hoang.pham@cloudpulse.io', role: 'Backend Developer', status: 'Active', lastActive: '2h ago' },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Quản lý Người dùng System</h1>
            <p className="text-sm text-slate-500">
              Danh sách quản trị viên, kỹ sư DevOps và thành viên có quyền truy cập hệ thống CloudPulse.
            </p>
          </div>

          <Button size="sm" className="h-9 px-4 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="w-4 h-4" />
            <span>Thêm Thành viên</span>
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase bg-slate-50">
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Hoạt động gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{u.role}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{u.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
