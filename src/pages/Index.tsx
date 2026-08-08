import { MainLayout } from '@/components/layout/MainLayout';
import { Statistics } from '@/components/stats/Statistics';
import { AnalysesSummary } from '@/components/dashboard/AnalysesSummary';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { CsvViewer } from '@/components/dashboard/CsvViewer';
import { ExportPDF } from '@/components/reports/ExportPDF';
import { CsvToPdf } from '@/components/reports/CsvToPdf';
import { DashboardDateFilter } from '@/components/dashboard/DashboardDateFilter';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold mb-1">DASHBOARD</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Análise detalhada do seu desempenho</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CsvToPdf />
            <ExportPDF />
          </div>
        </div>

        <DashboardDateFilter />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="xl:col-span-2 min-w-0">
            <Statistics />
          </div>
          <div className="min-w-0">
            <AnalysesSummary />
          </div>
        </div>

        <EquityCurve />
        <CsvViewer />
      </div>
    </MainLayout>
  );
}
