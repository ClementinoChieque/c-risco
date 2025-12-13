import { MainLayout } from '@/components/layout/MainLayout';
import { Statistics } from '@/components/stats/Statistics';
import { ExportPDF } from '@/components/reports/ExportPDF';

export default function StatsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Estatísticas</h1>
            <p className="text-muted-foreground">Análise detalhada do seu desempenho</p>
          </div>
          <ExportPDF />
        </div>

        <Statistics />
      </div>
    </MainLayout>
  );
}
