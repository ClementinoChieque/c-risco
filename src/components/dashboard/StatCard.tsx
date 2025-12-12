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
      "glass-card rounded-xl p-5 animate-fade-in",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label mb-2">{label}</p>
          <p className={cn(
            "stat-value",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          trend === 'up' && "bg-success/10 text-success",
          trend === 'down' && "bg-destructive/10 text-destructive",
          !trend && "bg-primary/10 text-primary",
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
