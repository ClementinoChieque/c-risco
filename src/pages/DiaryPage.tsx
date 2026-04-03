import { MainLayout } from '@/components/layout/MainLayout';
import { TradeDiary } from '@/components/diary/TradeDiary';
import { useTrade } from '@/context/TradeContext';
import { DollarSign } from 'lucide-react';

export default function DiaryPage() {
  const { riskSettings, propFirmSettings } = useTrade();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Diário de Trades</h1>
          <p className="text-muted-foreground">Histórico completo das suas operações</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Forex</p>
              <p className="font-mono font-bold text-lg">${riskSettings.accountBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cripto</p>
              <p className="font-mono font-bold text-lg">${riskSettings.cryptoAccountBalance.toLocaleString()}</p>
            </div>
          </div>
          {propFirmSettings.fundedBalance > 0 && (
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PropFirm</p>
                <p className="font-mono font-bold text-lg">${propFirmSettings.fundedBalance.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <TradeDiary />
      </div>
    </MainLayout>
  );
}
