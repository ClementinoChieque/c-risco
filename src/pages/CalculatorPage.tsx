import { useState, useRef, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RiskCalculator } from '@/components/calculator/RiskCalculator';
import { useTrade } from '@/context/TradeContext';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Bitcoin, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function CalculatorPage() {
  const { riskSettings, updateRiskSettings } = useTrade();
  const [localDailyRisk, setLocalDailyRisk] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = async (key: keyof typeof riskSettings, value: number) => {
    await updateRiskSettings({ [key]: value });
    toast.success('Saldo atualizado');
  };

  const handleDailyRiskChange = useCallback(([value]: number[]) => {
    setLocalDailyRisk(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await updateRiskSettings({ maxDailyRisk: value });
      setLocalDailyRisk(null);
      toast.success('Risco diário atualizado');
    }, 500);
  }, [updateRiskSettings]);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold mb-1">Calculadora de Risco</h1>
          <p className="text-muted-foreground">Calcule o tamanho ideal da sua posição</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Saldo FOREX</h3>
              </div>
            </div>
            <Input
              type="number"
              value={riskSettings.accountBalance}
              onChange={(e) => handleChange('accountBalance', parseFloat(e.target.value) || 0)}
              className="font-mono"
            />
          </div>

          <div className="glass-card rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Bitcoin className="h-4 w-4 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Saldo CRIPTO</h3>
              </div>
            </div>
            <Input
              type="number"
              value={riskSettings.cryptoAccountBalance}
              onChange={(e) => handleChange('cryptoAccountBalance', parseFloat(e.target.value) || 0)}
              className="font-mono"
            />
        </div>

        <div className="glass-card rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Risco Diário Máximo</h3>
              <p className="text-xs text-muted-foreground">Limite de risco total por dia</p>
            </div>
          </div>
          <div className="space-y-3">
            <Slider
              value={[localDailyRisk ?? riskSettings.maxDailyRisk]}
              onValueChange={handleDailyRiskChange}
              min={1}
              max={20}
              step={1}
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">1%</span>
              <span className="font-mono text-lg font-bold text-destructive">
                {localDailyRisk ?? riskSettings.maxDailyRisk}%
              </span>
              <span className="text-muted-foreground">20%</span>
            </div>
          </div>
        </div>
        </div>

        <RiskCalculator />
      </div>
    </MainLayout>
  );
}
