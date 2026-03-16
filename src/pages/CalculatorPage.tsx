import { MainLayout } from '@/components/layout/MainLayout';
import { RiskCalculator } from '@/components/calculator/RiskCalculator';
import { RiskSettings } from '@/components/settings/RiskSettings';

export default function CalculatorPage() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold mb-1">Calculadora de Risco</h1>
          <p className="text-muted-foreground">Calcule o tamanho ideal da sua posição</p>
        </div>

        <RiskCalculator />

        <div className="border-t border-border/40 pt-6">
          <h2 className="text-lg font-semibold mb-4">Configurações de Risco</h2>
          <RiskSettings />
        </div>
      </div>
    </MainLayout>
  );
}
