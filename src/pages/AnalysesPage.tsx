import { MainLayout } from '@/components/layout/MainLayout';
import { TradeReviews } from '@/components/analyses/TradeReviews';

export default function AnalysesPage() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold mb-1">Análises</h1>
          <p className="text-muted-foreground">Reveja os seus acertos e erros com imagens e legendas</p>
        </div>
        <TradeReviews />
      </div>
    </MainLayout>
  );
}
