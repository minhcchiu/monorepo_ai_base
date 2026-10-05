import { ReactNode } from 'react';
import { getStoredUser } from '@/lib/auth';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const user = getStoredUser();

  if (!user) return <>{fallback}</>;

  if (user.role === 'ADMIN') return <>{children}</>;

  const moduleName = permission.split(':')[0];
  if (user.role?.toUpperCase().includes(moduleName.toUpperCase())) return <>{children}</>;

  return <>{fallback}</>;
}
