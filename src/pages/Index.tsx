import { MainLayout } from '@/components/layout/MainLayout';
import { Statistics } from '@/components/stats/Statistics';
import { AnalysesSummary } from '@/components/dashboard/AnalysesSummary';
import { ExportPDF } from '@/components/reports/ExportPDF';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Análise detalhada do seu desempenho</p>
          </div>
          <ExportPDF />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Statistics />
          </div>
          <AnalysesSummary />
        </div>
      </div>
    </MainLayout>
  );
}
