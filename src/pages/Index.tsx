import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RiskGauge } from '@/components/dashboard/RiskGauge';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { AnalysesSummary } from '@/components/dashboard/AnalysesSummary';
import { useTrade } from '@/context/TradeContext';
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react';

export default function Dashboard() {
  const { trades, getOverallStats } = useTrade();
  const stats = getOverallStats();
  const openTrades = trades.filter(t => t.status === 'open').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu desempenho de trading</p>
        </div>

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
            trend={stats.winRate >= 50 ? 'up' : stats.winRate > 0 ? 'down' : 'neutral'}
          />
          <StatCard
            label="P&L Total"
            value={`$${stats.totalPnL.toFixed(2)}`}
            icon={DollarSign}
            trend={stats.totalPnL >= 0 ? 'up' : 'down'}
          />
          <StatCard
            label="Trades Abertos"
            value={openTrades}
            icon={Activity}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RiskGauge />
          <RecentTrades />
          <AnalysesSummary />
        </div>
      </div>
    </MainLayout>
  );
}
