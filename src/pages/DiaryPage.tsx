import { MainLayout } from '@/components/layout/MainLayout';
import { TradeDiary } from '@/components/diary/TradeDiary';

export default function DiaryPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Diário de Trades</h1>
          <p className="text-muted-foreground">Histórico completo das suas operações</p>
        </div>

        <TradeDiary />
      </div>
    </MainLayout>
  );
}
