import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  TrendingUp, 
  Target, 
  Percent, 
  DollarSign, 
  Trophy, 
  AlertTriangle,
  Flame,
  Scale
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

interface TradeAnalysis {
  id: string;
  type: string;
  amount: number | null;
  risk_reward: number | null;
  lot_size: number | null;
  risk_percentage: number | null;
  market: string;
  asset_pair: string | null;
  broker_name: string | null;
  created_at: string;
}

export function Statistics() {
  const [allAnalyses, setAllAnalyses] = useState<TradeAnalysis[]>([]);
  const [marketFilter, setMarketFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('trade_analyses')
        .select('id, type, amount, risk_reward, lot_size, risk_percentage, market, asset_pair, broker_name, created_at')
        .eq('user_id', SINGLE_USER_ID)
        .order('created_at', { ascending: true });

      if (data) setAllAnalyses(data as TradeAnalysis[]);
    }
    fetchData();
  }, []);

  const analyses = marketFilter === 'all' ? allAnalyses : allAnalyses.filter(a => a.market === marketFilter);

  const wins = analyses.filter(a => a.type === 'win');
  const losses = analyses.filter(a => a.type === 'loss');
  const totalTrades = analyses.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const totalGains = wins.reduce((s, d) => s + (d.amount || 0), 0);
  const totalLosses = losses.reduce((s, d) => s + Math.abs(d.amount || 0), 0);
  const netPnL = totalGains - totalLosses;
  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0;
  
  const allRR = analyses.filter(d => (d.risk_reward || 0) > 0);
  const avgRR = allRR.length > 0 ? allRR.reduce((s, d) => s + (d.risk_reward || 0), 0) / allRR.length : 0;

  const bestTrade = wins.length > 0 ? Math.max(...wins.map(w => w.amount || 0)) : 0;
  const worstTrade = losses.length > 0 ? Math.max(...losses.map(l => Math.abs(l.amount || 0))) : 0;

  // Consecutive wins
  let consecutiveWins = 0;
  let maxConsecutive = 0;
  for (const a of analyses) {
    if (a.type === 'win') {
      consecutiveWins++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveWins);
    } else {
      consecutiveWins = 0;
    }
  }

  // Last 7 days chart data from trade_analyses
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayAnalyses = analyses.filter(a => isSameDay(parseISO(a.created_at), date));
    const dayWins = dayAnalyses.filter(a => a.type === 'win');
    const dayLosses = dayAnalyses.filter(a => a.type === 'loss');
    const dayGains = dayWins.reduce((s, d) => s + (d.amount || 0), 0);
    const dayLossAmt = dayLosses.reduce((s, d) => s + Math.abs(d.amount || 0), 0);
    return {
      date: format(date, 'dd/MM', { locale: ptBR }),
      pnl: dayGains - dayLossAmt,
      wins: dayWins.length,
      losses: dayLosses.length,
    };
  });

  let cumulative = 0;
  const cumulativeData = last7Days.map(day => {
    cumulative += day.pnl;
    return { ...day, cumulative };
  });

  // Market distribution for pie chart
  const marketCounts = analyses.reduce((acc, a) => {
    acc[a.market] = (acc[a.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const marketData = Object.entries(marketCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const MARKET_COLORS = ['hsl(185, 100%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)'];

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Cripto' },
    { value: 'propfirm', label: 'PropFirm' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setMarketFilter(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              marketFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total de Trades"
          value={totalTrades}
          icon={TrendingUp}
        />
        <StatCard
          label="Taxa de Acerto"
          value={`${winRate.toFixed(1)}%`}
          icon={Target}
          trend={winRate >= 50 ? 'up' : 'down'}
        />
        <StatCard
          label="P&L Total"
          value={`$${netPnL.toFixed(2)}`}
          icon={DollarSign}
          trend={netPnL >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Profit Factor"
          value={profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
          icon={Scale}
          trend={profitFactor >= 1 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="R:R Médio"
          value={`1:${avgRR.toFixed(2)}`}
          icon={Percent}
        />
        <StatCard
          label="Melhor Trade"
          value={`$${bestTrade.toFixed(2)}`}
          icon={Trophy}
          trend="up"
        />
        <StatCard
          label="Pior Trade"
          value={`-$${worstTrade.toFixed(2)}`}
          icon={AlertTriangle}
          trend="down"
        />
        <StatCard
          label="Sequência Vitórias"
          value={maxConsecutive}
          icon={Flame}
        />
      </div>

      {analyses.length > 0 && (
        <>
          <div className="glass-card rounded-xl p-6 animate-fade-in">
            <h3 className="stat-label mb-4">P&L Acumulado (7 dias)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(222, 47%, 10%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L Acumulado']}
                  />
                  <Area type="monotone" dataKey="cumulative" stroke="hsl(185, 100%, 50%)" fillOpacity={1} fill="url(#colorPnl)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6 animate-fade-in">
              <h3 className="stat-label mb-4">Gains vs Losses (7 dias)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(222, 47%, 10%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                    />
                    <Bar dataKey="wins" stackId="a" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Gains" />
                    <Bar dataKey="losses" stackId="a" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Losses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {marketData.length > 0 && (
              <div className="glass-card rounded-xl p-6 animate-fade-in">
                <h3 className="stat-label mb-4">Distribuição por Mercado</h3>
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={marketData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" label={false}>
                        {marketData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={MARKET_COLORS[index % MARKET_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(222, 47%, 10%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '8px' }}
                        labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                        formatter={(value: number, name: string) => [`${value} trades`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  {marketData.map((entry, index) => {
                    const total = marketData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
                    return (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: MARKET_COLORS[index % MARKET_COLORS.length] }} />
                        <span>{entry.name} {pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {analyses.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">
            Registre negociações para visualizar estatísticas detalhadas
          </p>
        </div>
      )}
    </div>
  );
}
