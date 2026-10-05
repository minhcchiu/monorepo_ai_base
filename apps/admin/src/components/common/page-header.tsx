import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
}

export function PageHeader({ icon: Icon, iconColor = 'text-indigo-600', iconBg = 'bg-indigo-50', title, description }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <h1 className="text-[18px] font-bold text-slate-800 leading-tight">{title}</h1>
        <p className="text-[12px] text-slate-400 leading-tight">{description}</p>
      </div>
    </div>
  );
}
