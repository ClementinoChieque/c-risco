import { MainLayout } from '@/components/layout/MainLayout';
import { TradeAnalyses } from '@/components/trades/TradeAnalyses';

export default function TradesPage() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold mb-1">Negociações</h1>
          <p className="text-muted-foreground">Faça upload das suas análises de wins e losses</p>
        </div>
        <TradeAnalyses />
      </div>
    </MainLayout>
  );
}
