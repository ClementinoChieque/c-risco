import { useTrade } from '@/context/TradeContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { DollarSign, Percent, Shield, AlertTriangle, Hash, Bitcoin } from 'lucide-react';

export function RiskSettings() {
  const { riskSettings, updateRiskSettings } = useTrade();

  const handleChange = async (key: keyof typeof riskSettings, value: number) => {
    await updateRiskSettings({ [key]: value });
    toast.success('Configuração atualizada');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Saldo da Conta FOREX</h3>
            <p className="text-sm text-muted-foreground">Seu capital disponível para Forex</p>
          </div>
        </div>
        <Input
          type="number"
          value={riskSettings.accountBalance}
          onChange={(e) => handleChange('accountBalance', parseFloat(e.target.value) || 0)}
          className="font-mono text-xl"
        />
      </div>

      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-warning/10">
            <Bitcoin className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Saldo da Conta CRIPTO</h3>
            <p className="text-sm text-muted-foreground">Seu capital disponível para Criptomoedas</p>
          </div>
        </div>
        <Input
          type="number"
          value={riskSettings.cryptoAccountBalance}
          onChange={(e) => handleChange('cryptoAccountBalance', parseFloat(e.target.value) || 0)}
          className="font-mono text-xl"
        />
      </div>

      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-warning/10">
            <Percent className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Risco Máximo por Trade</h3>
            <p className="text-sm text-muted-foreground">Porcentagem máxima do capital por operação</p>
          </div>
        </div>
        <div className="space-y-4">
          <Slider
            value={[riskSettings.maxRiskPerTrade]}
            onValueChange={([value]) => handleChange('maxRiskPerTrade', value)}
            min={0.5}
            max={10}
            step={0.5}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">0.5%</span>
            <span className="font-mono text-lg font-bold text-warning">
              {riskSettings.maxRiskPerTrade}%
            </span>
            <span className="text-muted-foreground">10%</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-destructive/10">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">Risco Diário Máximo</h3>
            <p className="text-sm text-muted-foreground">Limite de risco total por dia</p>
          </div>
        </div>
        <div className="space-y-4">
          <Slider
            value={[riskSettings.maxDailyRisk]}
            onValueChange={([value]) => handleChange('maxDailyRisk', value)}
            min={1}
            max={20}
            step={1}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">1%</span>
            <span className="font-mono text-lg font-bold text-destructive">
              {riskSettings.maxDailyRisk}%
            </span>
            <span className="text-muted-foreground">20%</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">Perda Diária Máxima</h3>
            <p className="text-sm text-muted-foreground">Operações bloqueadas ao atingir este limite</p>
          </div>
        </div>
        <div className="space-y-4">
          <Slider
            value={[riskSettings.maxDailyLoss]}
            onValueChange={([value]) => handleChange('maxDailyLoss', value)}
            min={1}
            max={15}
            step={0.5}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">1%</span>
            <span className="font-mono text-lg font-bold text-destructive">
              {riskSettings.maxDailyLoss}%
            </span>
            <span className="text-muted-foreground">15%</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-accent/10">
            <Hash className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">Máximo de Trades Abertos</h3>
            <p className="text-sm text-muted-foreground">Número máximo de operações simultâneas</p>
          </div>
        </div>
        <div className="space-y-4">
          <Slider
            value={[riskSettings.maxOpenTrades]}
            onValueChange={([value]) => handleChange('maxOpenTrades', value)}
            min={1}
            max={20}
            step={1}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">1</span>
            <span className="font-mono text-lg font-bold text-accent">
              {riskSettings.maxOpenTrades}
            </span>
            <span className="text-muted-foreground">20</span>
          </div>
        </div>
      </div>
    </div>
  );
}
