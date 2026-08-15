import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Market = 'forex' | 'crypto' | 'propfirm';

const MARKETS: { key: Market; label: string; color: string }[] = [
  { key: 'forex', label: 'Forex', color: 'hsl(var(--primary))' },
  { key: 'crypto', label: 'Cripto', color: 'hsl(var(--success))' },
  { key: 'propfirm', label: 'PropFirm', color: 'hsl(var(--warning, 38 92% 50%))' },
];

interface Dataset {
  id: string;
  filename: string;
  headers: string[];
  rows: string[][];
  market: Market;
  created_at: string;
}

const LAST_SELECTED_KEY = 'csvViewer:lastSelectedByMarket';

function toNum(v: any): number {
  const s = (v ?? '').toString().replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
  return s === '' || isNaN(Number(s)) ? 0 : Number(s);
}

function parseCsvDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(year, Number(mo) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt;
  }
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

function detectColumns(headers: string[], rows: string[][]) {
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
  return { pnlNetIdx, pnlIdx, dateIdx };
}

export function CsvEquityCurve() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onChanged = () => setRefreshKey((k) => k + 1);
    window.addEventListener('csv-datasets:changed', onChanged);
    return () => window.removeEventListener('csv-datasets:changed', onChanged);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('csv_datasets')
        .select('id, filename, headers, rows, market, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setDatasets((data ?? []) as unknown as Dataset[]);
      setLoading(false);
    })();
  }, [user, refreshKey]);

  const activeByMarket = useMemo(() => {
    let selected: Record<string, string> = {};
    try { selected = JSON.parse(localStorage.getItem(LAST_SELECTED_KEY) || '{}'); } catch { /* ignore */ }
    const map: Partial<Record<Market, Dataset>> = {};
    datasets.forEach((d) => {
      const m = d.market as Market;
      if (!MARKETS.some((x) => x.key === m)) return;
      const chosen = selected[m];
      if (chosen) {
        if (d.id === chosen) map[m] = d;
      } else if (!map[m]) map[m] = d;
    });
    datasets.forEach((d) => {
      const m = d.market as Market;
      if (MARKETS.some((x) => x.key === m) && !map[m]) map[m] = d;
    });
    return map;
  }, [datasets]);

  const seriesByMarket = useMemo(() => {
    const result: Record<Market, { date: string; equity: number; pnl: number }[]> = {
      forex: [], crypto: [], propfirm: [],
    };
    (Object.keys(result) as Market[]).forEach((m) => {
      const ds = activeByMarket[m];
      if (!ds) return;
      const headers = ds.headers ?? [];
      const rows = ds.rows ?? [];
      const { pnlNetIdx, pnlIdx, dateIdx } = detectColumns(headers, rows);
      const refIdx = pnlNetIdx >= 0 ? pnlNetIdx : pnlIdx;
      if (refIdx < 0) return;

      const items = rows
        .map((r, i) => ({
          dt: dateIdx >= 0 ? parseCsvDate(r[dateIdx] ?? '') : null,
          value: toNum(r[refIdx]),
          i,
        }))
        .filter((x) => (dateIdx >= 0 ? !!x.dt : true))
        .sort((a, b) => (a.dt && b.dt ? a.dt.getTime() - b.dt.getTime() : a.i - b.i));

      let equity = 0;
      result[m] = items.map((x) => {
        equity += x.value;
        return {
          date: x.dt
            ? x.dt.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
            : `#${x.i + 1}`,
          equity: Number(equity.toFixed(2)),
          pnl: x.value,
        };
      });
    });
    return result;
  }, [activeByMarket]);

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="stat-label">Curva de Equity por Mercado (CSV)</h3>
      </div>

      <Tabs defaultValue="forex" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          {MARKETS.map((m) => (
            <TabsTrigger key={m.key} value={m.key} className="text-xs sm:text-sm">{m.label}</TabsTrigger>
          ))}
        </TabsList>

        {MARKETS.map((m) => {
          const data = seriesByMarket[m.key];
          const ds = activeByMarket[m.key];
          const finalEquity = data.length ? data[data.length - 1].equity : 0;
          return (
            <TabsContent key={m.key} value={m.key} className="mt-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {ds && (
                    <Badge variant="outline" className="gap-1 max-w-[220px]">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate" title={ds.filename}>{ds.filename}</span>
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{data.length} operações</span>
                </div>
                <span className={cn(
                  'text-lg font-bold font-mono',
                  finalEquity >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {finalEquity >= 0 ? '+' : '-'}${Math.abs(finalEquity).toFixed(2)}
                </span>
              </div>
              <div className="h-56 sm:h-64 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">A carregar…</div>
                ) : data.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center px-4">
                    Sem dados CSV para {m.label}. Faça upload em "Dados CSV".
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} minTickGap={20} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} width={50}
                        tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name) => [
                          `$${Number(value).toFixed(2)}`,
                          name === 'equity' ? 'Equity' : 'P&L',
                        ]}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                      <Line type="monotone" dataKey="equity" stroke={m.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="pnl" stroke="transparent" dot={false} activeDot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
