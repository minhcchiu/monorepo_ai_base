'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        if ((child.type as any).displayName === 'DropdownMenuTrigger') {
          return React.cloneElement(child as React.ReactElement<any>, {
            onClick: () => setOpen((prev) => !prev),
          });
        }
        if ((child.type as any).displayName === 'DropdownMenuContent') {
          if (!open) return null;
          return React.cloneElement(child as React.ReactElement<any>, {
            onClose: () => setOpen(false),
          });
        }
        return child;
      })}
    </div>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  onClick,
}: {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as any).props?.onClick?.(e);
        onClick?.();
      },
    });
  }
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export function DropdownMenuContent({
  align = 'end',
  className,
  children,
  onClose,
}: {
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className={cn(
        'absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-lg animate-in fade-in-80',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
}
DropdownMenuContent.displayName = 'DropdownMenuContent';

export function DropdownMenuItem({
  className,
  asChild,
  children,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors',
        className
      ),
      onClick,
    });
  }
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-200" />;
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('px-2 py-1 text-xs font-semibold text-slate-900', className)}>{children}</div>;
}
