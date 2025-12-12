import { useTrade } from '@/context/TradeContext';
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Statistics() {
  const { trades, getOverallStats, getDailyStats } = useTrade();
  const stats = getOverallStats();

  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStats = getDailyStats(date.toDateString());
    return {
      date: format(date, 'dd/MM', { locale: ptBR }),
      pnl: dayStats.totalPnL,
      trades: dayStats.trades,
      wins: dayStats.wins,
      losses: dayStats.losses,
    };
  });

  // Calculate cumulative P&L
  let cumulative = 0;
  const cumulativeData = last7Days.map(day => {
    cumulative += day.pnl;
    return { ...day, cumulative };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total de Trades"
          value={stats.totalTrades}
          icon={TrendingUp}
        />
        <StatCard
          label="Taxa de Acerto"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={Target}
          trend={stats.winRate >= 50 ? 'up' : 'down'}
        />
        <StatCard
          label="P&L Total"
          value={`$${stats.totalPnL.toFixed(2)}`}
          icon={DollarSign}
          trend={stats.totalPnL >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          icon={Scale}
          trend={stats.profitFactor >= 1 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="R:R Médio"
          value={`1:${stats.averageRR.toFixed(2)}`}
          icon={Percent}
        />
        <StatCard
          label="Melhor Trade"
          value={`$${stats.bestTrade.toFixed(2)}`}
          icon={Trophy}
          trend="up"
        />
        <StatCard
          label="Pior Trade"
          value={`$${stats.worstTrade.toFixed(2)}`}
          icon={AlertTriangle}
          trend="down"
        />
        <StatCard
          label="Sequência Vitórias"
          value={stats.consecutiveWins}
          icon={Flame}
        />
      </div>

      {trades.length > 0 && (
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
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 10%)',
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L Acumulado']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(185, 100%, 50%)" 
                    fillOpacity={1} 
                    fill="url(#colorPnl)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 animate-fade-in">
            <h3 className="stat-label mb-4">Trades por Dia (7 dias)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 10%)',
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                  />
                  <Bar 
                    dataKey="wins" 
                    stackId="a" 
                    fill="hsl(142, 76%, 36%)" 
                    radius={[4, 4, 0, 0]}
                    name="Vitórias"
                  />
                  <Bar 
                    dataKey="losses" 
                    stackId="a" 
                    fill="hsl(0, 72%, 51%)" 
                    radius={[4, 4, 0, 0]}
                    name="Derrotas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {trades.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">
            Registre trades para visualizar estatísticas detalhadas
          </p>
        </div>
      )}
    </div>
  );
}
