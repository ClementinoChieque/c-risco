import { MainLayout } from '@/components/layout/MainLayout';
import { RiskCalculator } from '@/components/calculator/RiskCalculator';

export default function CalculatorPage() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold mb-1">Calculadora de Risco</h1>
          <p className="text-muted-foreground">Calcule o tamanho ideal da sua posição</p>
        </div>

        <RiskCalculator />
      </div>
    </MainLayout>
  );
}
