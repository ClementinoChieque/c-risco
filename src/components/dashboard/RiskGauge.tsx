import { useTrade } from '@/context/TradeContext';
import { cn } from '@/lib/utils';

export function RiskGauge() {
  const { riskSettings, getTodayRiskUsed } = useTrade();
  const riskUsed = getTodayRiskUsed();
  const percentage = Math.min((riskUsed / riskSettings.maxDailyRisk) * 100, 100);

  const getColor = () => {
    if (percentage >= 80) return 'text-destructive';
    if (percentage >= 60) return 'text-warning';
    return 'text-success';
  };

  const getGradient = () => {
    if (percentage >= 80) return 'from-destructive to-destructive/50';
    if (percentage >= 60) return 'from-warning to-warning/50';
    return 'from-success to-success/50';
  };

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <h3 className="stat-label mb-4">Risco Diário Utilizado</h3>
      
      <div className="relative w-full h-4 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r",
            getGradient()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className={cn("font-mono text-4xl font-bold", getColor())}>
            {riskUsed.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-lg ml-1">
            / {riskSettings.maxDailyRisk}%
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {(100 - percentage).toFixed(0)}% disponível
        </span>
      </div>
    </div>
  );
}
