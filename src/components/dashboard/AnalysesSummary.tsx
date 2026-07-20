import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTrade } from '@/context/TradeContext';

interface AnalysisStats {
  totalGains: number;
  totalLosses: number;
  netPnL: number;
  winCount: number;
  lossCount: number;
  avgRR: number;
  csvClosedPnlNet: number;
  csvClosedPnl: number;
}

function toNum(v: any): number {
  const s = (v ?? '').toString().replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
  return s === '' || isNaN(Number(s)) ? 0 : Number(s);
}

export function AnalysesSummary() {
  const { user } = useAuth();
  const { currentMarket } = useTrade();
  const [stats, setStats] = useState<AnalysisStats>({
    totalGains: 0, totalLosses: 0, netPnL: 0, winCount: 0, lossCount: 0, avgRR: 0,
    csvClosedPnlNet: 0, csvClosedPnl: 0,
  });

  useEffect(() => {
    async function fetch() {
      if (!user) return;

      const { data: analyses } = await supabase
        .from('trade_analyses')
        .select('type, amount, risk_reward')
        .eq('user_id', user.id)
        .eq('market', currentMarket);

      const { data: csvDatasets } = await supabase
        .from('csv_datasets')
        .select('headers, rows')
        .eq('user_id', user.id)
        .eq('market', currentMarket);

      const wins = (analyses ?? []).filter((d: any) => d.type === 'win');
      const losses = (analyses ?? []).filter((d: any) => d.type === 'loss');

      const totalGains = wins.reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const totalLosses = losses.reduce((s: number, d: any) => s + Math.abs(d.amount || 0), 0);
      const allRR = (analyses ?? []).filter((d: any) => (d.risk_reward || 0) > 0);
      const avgRR = allRR.length > 0
        ? allRR.reduce((s: number, d: any) => s + d.risk_reward, 0) / allRR.length
        : 0;

      let csvClosedPnlNet = 0;
      let csvClosedPnl = 0;

      (csvDatasets ?? []).forEach((d: any) => {
        const headers: string[] = (d.headers ?? []) as string[];
        const rows: string[][] = (d.rows ?? []) as string[][];

        const pnlNetIdx = headers.findIndex((h) =>
          /closed\s*p[&/]?l\s*net|p[&/]?l\s*net/i.test((h ?? '').toString().trim())
        );
        const pnlIdx = headers.findIndex((h, i) => {
          const s = (h ?? '').toString().trim();
          return i !== pnlNetIdx && /closed\s*p[&/]?l|^\s*p[&/]?l\s*$|pnl|profit|lucro|resultado/i.test(s);
        });

        rows.forEach((row) => {
          if (pnlNetIdx >= 0) csvClosedPnlNet += toNum(row[pnlNetIdx]);
          if (pnlIdx >= 0) csvClosedPnl += toNum(row[pnlIdx]);
        });
      });

      setStats({
        totalGains,
        totalLosses,
        netPnL: totalGains - totalLosses,
        winCount: wins.length,
        lossCount: losses.length,
        avgRR,
        csvClosedPnlNet,
        csvClosedPnl,
      });
    }
    fetch();
  }, [user, currentMarket]);

  const total = stats.winCount + stats.lossCount;
  const winRate = total > 0 ? (stats.winCount / total) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 animate-fade-in h-full">
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
        <div className="col-span-2 space-y-1">
          <p className="text-xs text-muted-foreground">Closed P&L Net</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            stats.csvClosedPnlNet >= 0 ? "text-success" : "text-destructive"
          )}>
            {stats.csvClosedPnlNet >= 0 ? '+' : ''}${stats.csvClosedPnlNet.toFixed(2)}
          </p>
        </div>
        <div className="col-span-2 space-y-1">
          <p className="text-xs text-muted-foreground">Closed P&L</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            stats.csvClosedPnl >= 0 ? "text-success" : "text-destructive"
          )}>
            {stats.csvClosedPnl >= 0 ? '+' : ''}${stats.csvClosedPnl.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
