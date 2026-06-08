import { useTrade } from '@/context/TradeContext';
import { useAuth } from '@/context/AuthContext';
import { DollarSign, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import logo from '@/assets/logo.png';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header() {
  const { riskSettings, propFirmSettings, isBlocked, blockReason, getTodayRiskUsed } = useTrade();
  const { user, signOut } = useAuth();
  const todayRisk = getTodayRiskUsed();
  const displayName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    user?.email?.split('@')[0] ||
    '';

  return (
    <header className="glass-card sticky top-0 z-50 border-b border-border/50 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
          <img src={logo} alt="CRisco - Gestão de Trades" className="h-8 md:h-10 w-auto" />
          {displayName && (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-[10px] md:text-xs font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span
                className="truncate text-xs md:text-sm font-medium text-foreground/90 max-w-[100px] md:max-w-none"
                title={displayName}
              >
                {displayName}
              </span>
            </div>
          )}
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


          <Button variant="ghost" size="icon" onClick={signOut} title="Sair" className="h-7 w-7">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
