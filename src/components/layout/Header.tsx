import { useTrade } from '@/context/TradeContext';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, DollarSign, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

export function Header() {
  const { riskSettings, propFirmSettings, isBlocked, blockReason, getTodayRiskUsed } = useTrade();
  const { signOut } = useAuth();
  const todayRisk = getTodayRiskUsed();

  return (
    <header className="glass-card sticky top-0 z-50 border-b border-border/50 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <img src={logo} alt="CRisco - Gestão de Trades" className="h-8 md:h-10 w-auto" />
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
          <Button variant="ghost" size="icon" onClick={signOut} title="Sair" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
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
          <Button variant="ghost" size="icon" onClick={signOut} title="Sair" className="h-7 w-7">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
