import { MainLayout } from '@/components/layout/MainLayout';
import { TradingSessions } from '@/components/sessions/TradingSessions';

export default function SessionsPage() {
  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">Sessões</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Melhores horários para negociar (WAT - Angola)</p>
        </div>
        <TradingSessions />
      </div>
    </MainLayout>
  );
}
