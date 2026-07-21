import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "glass-card rounded-xl p-3 md:p-5 animate-fade-in",
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="stat-label mb-1 md:mb-2 text-[10px] md:text-sm truncate">{label}</p>
          <p className={cn(
            "font-mono text-xs sm:text-sm md:text-2xl font-bold tracking-tight break-words",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          "p-1.5 md:p-3 rounded-lg shrink-0",
          trend === 'up' && "bg-success/10 text-success",
          trend === 'down' && "bg-destructive/10 text-destructive",
          !trend && "bg-primary/10 text-primary",
        )}>
          <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
        </div>
      </div>
    </div>
  );
}
