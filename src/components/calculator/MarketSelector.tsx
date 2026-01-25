import { useTrade } from '@/context/TradeContext';
import { Market } from '@/types/trade';
import { cn } from '@/lib/utils';
import { Coins, DollarSign, Building2 } from 'lucide-react';

const markets: { value: Market; label: string; icon: React.ElementType }[] = [
  { value: 'forex', label: 'Forex', icon: DollarSign },
  { value: 'crypto', label: 'Cripto', icon: Coins },
  { value: 'propfirm', label: 'PropFirm', icon: Building2 },
];

export function MarketSelector() {
  const { currentMarket, setCurrentMarket } = useTrade();

  return (
    <div className="flex gap-2">
      {markets.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setCurrentMarket(value)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200",
            currentMarket === value
              ? "bg-primary text-primary-foreground glow-primary"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
