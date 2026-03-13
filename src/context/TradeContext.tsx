import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { Trade, RiskSettings, Market, OverallStats, DailyStats } from '@/types/trade';
import { useTrades } from '@/hooks/useTrades';
import { useRiskSettings } from '@/hooks/useRiskSettings';

interface TradeContextType {
  trades: Trade[];
  riskSettings: RiskSettings;
  currentMarket: Market;
  isBlocked: boolean;
  blockReason: string | null;
  loading: boolean;
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => Promise<boolean>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  closeTrade: (id: string, result: number) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  updateRiskSettings: (settings: Partial<RiskSettings>) => Promise<void>;
  setCurrentMarket: (market: Market) => void;
  getOverallStats: () => OverallStats;
  getDailyStats: (date: string) => DailyStats;
  getTodayRiskUsed: () => number;
  canOpenNewTrade: (riskAmount: number) => { allowed: boolean; reason?: string };
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: ReactNode }) {
  const { trades, loading: tradesLoading, addTrade, updateTrade, closeTrade: closeTradeBase, deleteTrade } = useTrades();
  const { riskSettings, loading: settingsLoading, updateRiskSettings } = useRiskSettings();
  const [currentMarket, setCurrentMarket] = useState<Market>('forex');

  const loading = tradesLoading || settingsLoading;

  // Trades filtered by current market
  const marketTrades = useMemo(() => trades.filter(t => t.market === currentMarket), [trades, currentMarket]);

  // Close trade and update account balance based on result and market
  const closeTrade = useCallback(async (id: string, result: number) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;

    await closeTradeBase(id, result);
    
    // PropFirm trades don't affect forex/crypto balances
    if (trade.market === 'propfirm') return;

    if (trade.market === 'crypto') {
      const newBalance = riskSettings.cryptoAccountBalance + result;
      await updateRiskSettings({ cryptoAccountBalance: newBalance });
    } else {
      const newBalance = riskSettings.accountBalance + result;
      await updateRiskSettings({ accountBalance: newBalance });
    }
  }, [closeTradeBase, trades, riskSettings.accountBalance, riskSettings.cryptoAccountBalance, updateRiskSettings]);

  const getTodayRiskUsed = useCallback(() => {
    const today = new Date().toDateString();
    return marketTrades
      .filter(t => new Date(t.createdAt).toDateString() === today)
      .reduce((sum, t) => sum + t.riskPercentage, 0);
  }, [marketTrades]);

  const getTodayPnL = useCallback(() => {
    const today = new Date().toDateString();
    return marketTrades
      .filter(t => t.status === 'closed' && t.closedAt && new Date(t.closedAt).toDateString() === today)
      .reduce((sum, t) => sum + (t.result || 0), 0);
  }, [marketTrades]);

  const getOpenTradesCount = useCallback(() => {
    return marketTrades.filter(t => t.status === 'open').length;
  }, [marketTrades]);

  const canOpenNewTrade = useCallback((riskAmount: number): { allowed: boolean; reason?: string } => {
    const riskPercentage = (riskAmount / riskSettings.accountBalance) * 100;

    if (riskPercentage > riskSettings.maxRiskPerTrade) {
      return {
        allowed: false,
        reason: `Risco por trade (${riskPercentage.toFixed(2)}%) excede o máximo permitido (${riskSettings.maxRiskPerTrade}%)`,
      };
    }

    if (getOpenTradesCount() >= riskSettings.maxOpenTrades) {
      return {
        allowed: false,
        reason: `Número máximo de trades abertos (${riskSettings.maxOpenTrades}) atingido`,
      };
    }

    const todayRisk = getTodayRiskUsed();
    if (todayRisk + riskPercentage > riskSettings.maxDailyRisk) {
      return {
        allowed: false,
        reason: `Risco diário (${(todayRisk + riskPercentage).toFixed(2)}%) excederia o limite (${riskSettings.maxDailyRisk}%)`,
      };
    }

    const todayPnL = getTodayPnL();
    const dailyLossLimit = -(riskSettings.accountBalance * riskSettings.maxDailyLoss) / 100;
    if (todayPnL <= dailyLossLimit) {
      return {
        allowed: false,
        reason: `Limite de perda diária (${riskSettings.maxDailyLoss}%) atingido`,
      };
    }

    return { allowed: true };
  }, [riskSettings, getOpenTradesCount, getTodayRiskUsed, getTodayPnL]);

  const { isBlocked, blockReason } = useMemo(() => {
    const todayPnL = getTodayPnL();
    const dailyLossLimit = -(riskSettings.accountBalance * riskSettings.maxDailyLoss) / 100;

    if (todayPnL <= dailyLossLimit) {
      return {
        isBlocked: true,
        blockReason: `Operações bloqueadas: limite de perda diária de ${riskSettings.maxDailyLoss}% atingido`,
      };
    }

    if (getTodayRiskUsed() >= riskSettings.maxDailyRisk) {
      return {
        isBlocked: true,
        blockReason: `Operações bloqueadas: risco diário máximo de ${riskSettings.maxDailyRisk}% atingido`,
      };
    }

    return { isBlocked: false, blockReason: null };
  }, [riskSettings, getTodayPnL, getTodayRiskUsed]);

  const getOverallStats = useCallback((): OverallStats => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const wins = closedTrades.filter(t => (t.result || 0) > 0);
    const losses = closedTrades.filter(t => (t.result || 0) < 0);

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.result || 0), 0);
    const grossProfit = wins.reduce((sum, t) => sum + (t.result || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.result || 0), 0));

    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecWins = 0;
    let maxConsecLosses = 0;

    closedTrades.forEach(t => {
      if ((t.result || 0) > 0) {
        consecutiveWins++;
        consecutiveLosses = 0;
        maxConsecWins = Math.max(maxConsecWins, consecutiveWins);
      } else {
        consecutiveLosses++;
        consecutiveWins = 0;
        maxConsecLosses = Math.max(maxConsecLosses, consecutiveLosses);
      }
    });

    return {
      totalTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      averageRR: closedTrades.length > 0 
        ? closedTrades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / closedTrades.length 
        : 0,
      totalPnL,
      bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.result || 0)) : 0,
      worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.result || 0)) : 0,
      consecutiveWins: maxConsecWins,
      consecutiveLosses: maxConsecLosses,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    };
  }, [trades]);

  const getDailyStats = useCallback((date: string): DailyStats => {
    const dayTrades = trades.filter(t => new Date(t.createdAt).toDateString() === date);
    const closedDayTrades = dayTrades.filter(t => t.status === 'closed');

    return {
      date,
      trades: dayTrades.length,
      wins: closedDayTrades.filter(t => (t.result || 0) > 0).length,
      losses: closedDayTrades.filter(t => (t.result || 0) < 0).length,
      totalPnL: closedDayTrades.reduce((sum, t) => sum + (t.result || 0), 0),
      riskUsed: dayTrades.reduce((sum, t) => sum + t.riskPercentage, 0),
    };
  }, [trades]);

  return (
    <TradeContext.Provider
      value={{
        trades,
        riskSettings,
        currentMarket,
        isBlocked,
        blockReason,
        loading,
        addTrade,
        updateTrade,
        closeTrade,
        deleteTrade,
        updateRiskSettings,
        setCurrentMarket,
        getOverallStats,
        getDailyStats,
        getTodayRiskUsed,
        canOpenNewTrade,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
}

export function useTrade() {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
}
