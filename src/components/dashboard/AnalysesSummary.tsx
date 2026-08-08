import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTrade } from '@/context/TradeContext';
import { useDateRange } from '@/context/DateRangeContext';

type Market = 'forex' | 'crypto' | 'propfirm';

interface CsvTotals {
  closedPnlNet: number;
  closedPnl: number;
  winCount: number;
  lossCount: number;
  filename?: string;
  updatedAt?: string;
  rowCount?: number;
  dateFiltered?: boolean;
}

interface AnalysisStats {
  totalGains: number;
  totalLosses: number;
  netPnL: number;
  winCount: number;
  lossCount: number;
  avgRR: number;
  csvByMarket: Record<Market, CsvTotals>;
}

const MARKET_LABELS: Record<Market, string> = {
  forex: 'Forex',
  crypto: 'Cripto',
  propfirm: 'PropFirm',
};

function toNum(v: any): number {
  const s = (v ?? '').toString().replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
  return s === '' || isNaN(Number(s)) ? 0 : Number(s);
}

function parseCsvDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(year, Number(mo) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt;
  }
  return null;
}

function emptyTotals(): CsvTotals {
  return { closedPnlNet: 0, closedPnl: 0, winCount: 0, lossCount: 0 };
}

export function AnalysesSummary() {
  const { user } = useAuth();
  const { currentMarket } = useTrade();
  const { inRange, hasRange, from, to } = useDateRange();
  const [stats, setStats] = useState<AnalysisStats>({
    totalGains: 0, totalLosses: 0, netPnL: 0, winCount: 0, lossCount: 0, avgRR: 0,
    csvByMarket: { forex: emptyTotals(), crypto: emptyTotals(), propfirm: emptyTotals() },
  });

  useEffect(() => {
    async function fetch() {
      if (!user) return;

      const { data: analyses } = await supabase
        .from('trade_analyses')
        .select('type, amount, risk_reward, created_at')
        .eq('user_id', user.id)
        .eq('market', currentMarket);

      const { data: csvDatasets } = await supabase
        .from('csv_datasets')
        .select('id, headers, rows, market, created_at, updated_at, filename')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const scoped = (analyses ?? []).filter((d: any) => inRange(d.created_at));
      const wins = scoped.filter((d: any) => d.type === 'win');
      const losses = scoped.filter((d: any) => d.type === 'loss');

      const totalGains = wins.reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const totalLosses = losses.reduce((s: number, d: any) => s + Math.abs(d.amount || 0), 0);
      const allRR = scoped.filter((d: any) => (d.risk_reward || 0) > 0);
      const avgRR = allRR.length > 0
        ? allRR.reduce((s: number, d: any) => s + d.risk_reward, 0) / allRR.length
        : 0;

      const csvByMarket: Record<Market, CsvTotals> = {
        forex: emptyTotals(), crypto: emptyTotals(), propfirm: emptyTotals(),
      };

      // Um único dataset por mercado (o seleccionado no CsvViewer, senão o mais recente)
      let selectedByMarket: Record<string, string> = {};
      try {
        selectedByMarket = JSON.parse(localStorage.getItem('csvViewer:lastSelectedByMarket') || '{}');
      } catch { /* ignore */ }

      const activeByMarket: Partial<Record<Market, any>> = {};
      (csvDatasets ?? []).forEach((d: any) => {
        const market = (d.market as Market);
        if (!csvByMarket[market]) return;
        const chosenId = selectedByMarket[market];
        if (chosenId) {
          if (d.id === chosenId) activeByMarket[market] = d;
        } else if (!activeByMarket[market]) {
          activeByMarket[market] = d; // mais recente (ordenado desc)
        }
      });
      // fallback: se o id guardado já não existe, usa o mais recente
      (csvDatasets ?? []).forEach((d: any) => {
        const market = (d.market as Market);
        if (!csvByMarket[market]) return;
        if (!activeByMarket[market]) activeByMarket[market] = d;
      });

      (Object.keys(csvByMarket) as Market[]).forEach((market) => {
        const d = activeByMarket[market];
        if (!d) return;
        const headers: string[] = (d.headers ?? []) as string[];
        const rows: string[][] = (d.rows ?? []) as string[][];

        const pnlNetIdx = headers.findIndex((h) =>
          /closed\s*p[&/]?l\s*net|p[&/]?l\s*net/i.test((h ?? '').toString().trim())
        );
        const pnlIdx = headers.findIndex((h, i) => {
          const s = (h ?? '').toString().trim();
          return i !== pnlNetIdx && /closed\s*p[&/]?l|^\s*p[&/]?l\s*$|pnl|profit|lucro|resultado/i.test(s);
        });

        const sample = rows.slice(0, 30);
        let dateIdx = -1;
        const dateHints = /date|data|time|hora|timestamp/i;
        for (let i = 0; i < headers.length; i++) {
          const parseable = sample.filter((r) => parseCsvDate(r[i] ?? '')).length;
          if (dateHints.test(headers[i] ?? '') && parseable > sample.length * 0.4) { dateIdx = i; break; }
        }
        if (dateIdx < 0) {
          for (let i = 0; i < headers.length; i++) {
            const parseable = sample.filter((r) => parseCsvDate(r[i] ?? '')).length;
            if (parseable > sample.length * 0.6) { dateIdx = i; break; }
          }
        }

        const refIdx = pnlNetIdx >= 0 ? pnlNetIdx : pnlIdx;
        const bucket = csvByMarket[market];
        bucket.filename = d.filename;
        bucket.updatedAt = d.updated_at ?? d.created_at;
        const scopedRows = dateIdx >= 0 ? rows.filter((r) => inRange(parseCsvDate(r[dateIdx] ?? ''))) : rows;
        bucket.rowCount = scopedRows.length;
        bucket.dateFiltered = dateIdx >= 0;


        scopedRows.forEach((row) => {
          if (pnlNetIdx >= 0) bucket.closedPnlNet += toNum(row[pnlNetIdx]);
          if (pnlIdx >= 0) bucket.closedPnl += toNum(row[pnlIdx]);
          if (refIdx >= 0) {
            const v = toNum(row[refIdx]);
            if (v > 0) bucket.winCount++;
            else if (v < 0) bucket.lossCount++;
          }
        });
      });

      setStats({
        totalGains,
        totalLosses,
        netPnL: totalGains - totalLosses,
        winCount: wins.length,
        lossCount: losses.length,
        avgRR,
        csvByMarket,
      });
    }
    fetch();
  }, [user, currentMarket, from, to]);

  const total = stats.winCount + stats.lossCount;
  const winRate = total > 0 ? (stats.winCount / total) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 animate-fade-in h-full">
      <h3 className="stat-label mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Resumo de Negociações
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

      <div className="mt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Dados CSV por Mercado
        </p>
        {(Object.keys(MARKET_LABELS) as Market[]).map((m) => {
          const t = stats.csvByMarket[m];
          const totalCsv = t.winCount + t.lossCount;
          const csvWinRate = totalCsv > 0 ? (t.winCount / totalCsv) * 100 : 0;
          const hasData = totalCsv > 0 || t.closedPnl !== 0 || t.closedPnlNet !== 0;
          const updatedLabel = t.updatedAt
            ? new Date(t.updatedAt).toLocaleString('pt-PT', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
            : null;

          return (
            <div
              key={m}
              className={cn(
                "rounded-lg border border-border/50 p-3 space-y-2",
                m === currentMarket && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{MARKET_LABELS[m]}</p>
                {!t.filename && <span className="text-xs text-muted-foreground">Sem ficheiro</span>}
              </div>
              {t.filename && (
                <div className="flex items-start gap-1.5 rounded-md bg-muted/30 px-2 py-1.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" title={t.filename}>{t.filename}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.rowCount ?? 0} linhas{hasRange && t.dateFiltered ? ' no período' : ''}
                      {updatedLabel && <> · actualizado {updatedLabel}</>}
                    </p>
                  </div>
                </div>
              )}

              {hasData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">P&L Net</p>
                    <p className={cn(
                      "font-mono font-bold text-sm",
                      t.closedPnlNet >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {t.closedPnlNet >= 0 ? '+' : ''}${t.closedPnlNet.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">P&L</p>
                    <p className={cn(
                      "font-mono font-bold text-sm",
                      t.closedPnl >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {t.closedPnl >= 0 ? '+' : ''}${t.closedPnl.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vencedores</p>
                    <p className="font-mono font-bold text-sm text-success">{t.winCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Derrotados</p>
                    <p className="font-mono font-bold text-sm text-destructive">{t.lossCount}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Taxa de Acerto</p>
                    <p className={cn(
                      "font-mono font-bold text-sm",
                      csvWinRate >= 50 ? "text-success" : "text-destructive"
                    )}>
                      {csvWinRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
