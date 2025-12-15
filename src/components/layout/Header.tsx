import { useTrade } from '@/context/TradeContext';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

const forexCurrencies = ['USD', 'EUR', 'GBP'];

export function Header() {
  const { riskSettings, isBlocked, blockReason, getTodayRiskUsed } = useTrade();
  const [currencyIndex, setCurrencyIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrencyIndex((prev) => (prev + 1) % forexCurrencies.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const todayRisk = getTodayRiskUsed();

  return (
    <header className="glass-card sticky top-0 z-50 border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">RiskMaster</h1>
            <p className="text-xs text-muted-foreground">Trade Risk Management</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Forex ({forexCurrencies[currencyIndex]}):</span>
            <span className="font-mono text-sm">
              ${riskSettings.accountBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cripto:</span>
            <span className="font-mono text-sm">
              ${riskSettings.cryptoAccountBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Risco Diário:</span>
            <Badge 
              variant={todayRisk > riskSettings.maxDailyRisk * 0.8 ? "destructive" : "secondary"}
              className="font-mono"
            >
              {todayRisk.toFixed(1)}% / {riskSettings.maxDailyRisk}%
            </Badge>
          </div>

          {isBlocked && (
            <div className="flex items-center gap-2 text-destructive animate-pulse">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">{blockReason}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
