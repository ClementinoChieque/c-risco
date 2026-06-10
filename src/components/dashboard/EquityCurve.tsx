import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Row = { created_at: string; amount: number | null; type: string; market: string | null };
type Market = 'forex' | 'crypto' | 'propfirm';

const MARKETS: { key: Market; label: string; color: string }[] = [
  { key: 'forex', label: 'Forex', color: 'hsl(var(--primary))' },
  { key: 'crypto', label: 'Crypto', color: 'hsl(var(--success))' },
  { key: 'propfirm', label: 'PropFirm', color: 'hsl(var(--warning, 38 92% 50%))' },
];

export function EquityCurve() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('trade_analyses')
        .select('created_at, amount, type, market')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const seriesByMarket = useMemo(() => {
    const result: Record<Market, { date: string; equity: number; pnl: number }[]> = {
      forex: [], crypto: [], propfirm: [],
    };
    (['forex', 'crypto', 'propfirm'] as Market[]).forEach((m) => {
      let equity = 0;
      const filtered = rows.filter(r => (r.market || 'forex') === m);
      result[m] = filtered.map(r => {
        const pnl = r.type === 'win' ? Number(r.amount || 0) : -Math.abs(Number(r.amount || 0));
        equity += pnl;
        return {
          date: new Date(r.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
          equity: Number(equity.toFixed(2)),
          pnl,
        };
      });
    });
    return result;
  }, [rows]);

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="stat-label">Curva de Equity por Mercado</h3>
      </div>

      <Tabs defaultValue="forex" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          {MARKETS.map(m => (
            <TabsTrigger key={m.key} value={m.key}>{m.label}</TabsTrigger>
          ))}
        </TabsList>

        {MARKETS.map(m => {
          const data = seriesByMarket[m.key];
          const finalEquity = data.length ? data[data.length - 1].equity : 0;
          return (
            <TabsContent key={m.key} value={m.key} className="mt-0">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs text-muted-foreground">{data.length} operações</span>
                <span className={cn(
                  'text-lg font-bold font-mono',
                  finalEquity >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {finalEquity >= 0 ? '+' : ''}${finalEquity.toFixed(2)}
                </span>
              </div>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">A carregar…</div>
                ) : data.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados para {m.label}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={m.color} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} width={50}
                        tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name) => [`$${Number(value).toFixed(2)}`, name === 'equity' ? 'Equity' : 'PnL']}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke={m.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        fill={`url(#grad-${m.key})`}
                      />
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
