import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

interface FilterCardProps {
  children: ReactNode;
  total?: number;
  totalLabel?: string;
  isLoading?: boolean;
}

export function FilterCard({ children, total, totalLabel = 'results', isLoading }: FilterCardProps) {
  return (
    <div className="rounded-xl bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 shrink-0 select-none">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Lọc
        </div>

        {children}

        {!isLoading && total !== undefined && (
          <span className="ml-auto text-[12px] text-slate-400 shrink-0">
            <span className="font-bold text-slate-700">{total.toLocaleString()}</span>{' '}
            {totalLabel}
          </span>
        )}
      </div>
    </div>
  );
}
