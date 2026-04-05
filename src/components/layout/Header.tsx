import { useTrade } from '@/context/TradeContext';
import { AlertTriangle, DollarSign } from 'lucide-react';
import logo from '@/assets/logo.png';

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


          {isBlocked && (
            <div className="flex items-center gap-2 text-destructive animate-pulse">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">{blockReason}</span>
            </div>
          )}
        </div>

        {/* Mobile: compact info */}
        <div className="flex md:hidden flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground">FX:</span>
            <span className="font-mono text-[11px]">
              ${riskSettings.accountBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground">CR:</span>
            <span className="font-mono text-[11px]">
              ${riskSettings.cryptoAccountBalance.toLocaleString()}
            </span>
          </div>

          {propFirmSettings.fundedBalance > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground">PF:</span>
              <span className="font-mono text-[11px]">
                ${propFirmSettings.fundedBalance.toLocaleString()}
              </span>
            </div>
          )}


          {isBlocked && (
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse shrink-0" />
          )}
        </div>
      </div>
    </header>
  );
}
