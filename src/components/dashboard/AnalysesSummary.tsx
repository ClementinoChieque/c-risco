import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

interface AnalysisStats {
  totalGains: number;
  totalLosses: number;
  netPnL: number;
  winCount: number;
  lossCount: number;
  avgRR: number;
}

export function AnalysesSummary() {
  const [stats, setStats] = useState<AnalysisStats>({
    totalGains: 0, totalLosses: 0, netPnL: 0, winCount: 0, lossCount: 0, avgRR: 0,
  });

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('trade_analyses')
        .select('type, amount, risk_reward')
        .eq('user_id', SINGLE_USER_ID);

      if (!data) return;

      const wins = data.filter((d: any) => d.type === 'win');
      const losses = data.filter((d: any) => d.type === 'loss');

      const totalGains = wins.reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const totalLosses = losses.reduce((s: number, d: any) => s + Math.abs(d.amount || 0), 0);
      const allRR = data.filter((d: any) => (d.risk_reward || 0) > 0);
      const avgRR = allRR.length > 0
        ? allRR.reduce((s: number, d: any) => s + d.risk_reward, 0) / allRR.length
        : 0;

      setStats({
        totalGains,
        totalLosses,
        netPnL: totalGains - totalLosses,
        winCount: wins.length,
        lossCount: losses.length,
        avgRR,
      });
    }
    fetch();
  }, []);

  const total = stats.winCount + stats.lossCount;
  const winRate = total > 0 ? (stats.winCount / total) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <h3 className="stat-label mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Resumo de Negociações
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total Gains</p>
          <p className="text-lg font-bold text-success font-mono">+${stats.totalGains.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{stats.winCount} operações</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total Losses</p>
          <p className="text-lg font-bold text-destructive font-mono">-${stats.totalLosses.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{stats.lossCount} operações</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">P&L Líquido</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            stats.netPnL >= 0 ? "text-success" : "text-destructive"
          )}>
            {stats.netPnL >= 0 ? '+' : ''}${stats.netPnL.toFixed(2)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            winRate >= 50 ? "text-success" : "text-destructive"
          )}>
            {winRate.toFixed(1)}%
          </p>
        </div>
        <div className="col-span-2 space-y-1">
          <p className="text-xs text-muted-foreground">RR Médio</p>
          <p className="text-lg font-bold font-mono text-primary">
            {stats.avgRR.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
