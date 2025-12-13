import { forwardRef } from 'react';
import { useTrade } from '@/context/TradeContext';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RecentTrades = forwardRef<HTMLDivElement>(function RecentTrades(_, ref) {
  const { trades } = useTrade();
  const recentTrades = trades.slice(0, 5);

  if (recentTrades.length === 0) {
    return (
      <div ref={ref} className="glass-card rounded-xl p-6 animate-fade-in">
        <h3 className="stat-label mb-4">Trades Recentes</h3>
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhum trade registrado ainda
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="glass-card rounded-xl p-6 animate-fade-in">
      <h3 className="stat-label mb-4">Trades Recentes</h3>
      
      <div className="space-y-3">
        {recentTrades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                trade.direction === 'long' ? "bg-success/10" : "bg-destructive/10"
              )}>
                {trade.direction === 'long' ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{trade.pair}</p>
                <p className="text-xs text-muted-foreground capitalize">{trade.market}</p>
              </div>
            </div>

            <div className="text-right">
              <Badge 
                variant={trade.status === 'open' ? 'default' : 'secondary'}
                className="font-mono text-xs"
              >
                {trade.status === 'open' ? 'Aberto' : trade.status === 'closed' ? 'Fechado' : 'Cancelado'}
              </Badge>
              {trade.status === 'closed' && trade.result !== undefined && (
                <p className={cn(
                  "font-mono text-sm mt-1",
                  trade.result > 0 ? "text-success" : "text-destructive"
                )}>
                  {trade.result > 0 ? '+' : ''}{trade.result.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
