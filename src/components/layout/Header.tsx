import { useTrade } from '@/context/TradeContext';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

export function Header() {
  const { riskSettings, propFirmSettings, isBlocked, blockReason, getTodayRiskUsed } = useTrade();
  const todayRisk = getTodayRiskUsed();

  return (
    <header className="glass-card sticky top-0 z-50 border-b border-border/50 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="relative">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-success animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold gradient-text">RiskMaster</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Trade Risk Management</p>
          </div>
        </div>

        {/* Desktop: full info */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Forex:</span>
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

          {propFirmSettings.fundedBalance > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">PropFirm:</span>
              <span className="font-mono text-sm">
                ${propFirmSettings.fundedBalance.toLocaleString()}
              </span>
            </div>
          )}

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

        {/* Mobile: compact info */}
        <div className="flex md:hidden items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-xs">
              ${riskSettings.accountBalance.toLocaleString()}
            </span>
          </div>

          {propFirmSettings.fundedBalance > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground">PF:</span>
              <span className="font-mono text-xs">
                ${propFirmSettings.fundedBalance.toLocaleString()}
              </span>
            </div>
          )}

          <Badge 
            variant={todayRisk > riskSettings.maxDailyRisk * 0.8 ? "destructive" : "secondary"}
            className="font-mono text-[10px] shrink-0"
          >
            {todayRisk.toFixed(1)}%
          </Badge>

          {isBlocked && (
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse shrink-0" />
          )}
        </div>
      </div>
    </header>
  );
}
