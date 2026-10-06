import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full', className)}>
      {children}
    </div>
  );
}

export function AvatarFallback({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-slate-100 font-medium text-slate-700 text-xs select-none',
        className
      )}
    >
      {children}
    </div>
  );
}
