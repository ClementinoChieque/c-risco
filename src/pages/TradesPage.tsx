import { MainLayout } from '@/components/layout/MainLayout';
import { TradeAnalyses } from '@/components/trades/TradeAnalyses';
import { BalanceManager } from '@/components/trades/BalanceManager';
import { TradeCalendar } from '@/components/trades/TradeCalendar';

export default function TradesPage() {
  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Negociações</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Faça upload das suas análises de wins e losses</p>
        </div>
        <BalanceManager />
        <TradeCalendar />
        <TradeAnalyses />
      </div>
    </MainLayout>
  );
}
