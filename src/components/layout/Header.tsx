import { useTrade } from '@/context/TradeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, DollarSign, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { riskSettings, isBlocked, blockReason, getTodayRiskUsed, user, signOut } = useTrade();
  const todayRisk = getTodayRiskUsed();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair');
    } else {
      toast.success('Você saiu da conta');
      navigate('/auth');
    }
  };

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
            <span className="font-mono text-sm">
              ${riskSettings.accountBalance.toLocaleString()}
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

          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
