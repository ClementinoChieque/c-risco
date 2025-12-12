import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Trade, RiskSettings, Market, OverallStats, DailyStats } from '@/types/trade';

interface TradeContextType {
  trades: Trade[];
  riskSettings: RiskSettings;
  currentMarket: Market;
  isBlocked: boolean;
  blockReason: string | null;
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => boolean;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  closeTrade: (id: string, result: number) => void;
  deleteTrade: (id: string) => void;
  updateRiskSettings: (settings: Partial<RiskSettings>) => void;
  setCurrentMarket: (market: Market) => void;
  getOverallStats: () => OverallStats;
  getDailyStats: (date: string) => DailyStats;
  getTodayRiskUsed: () => number;
  canOpenNewTrade: (riskAmount: number) => { allowed: boolean; reason?: string };
}

const defaultRiskSettings: RiskSettings = {
  accountBalance: 10000,
  maxRiskPerTrade: 2,
  maxDailyRisk: 6,
  maxOpenTrades: 5,
  maxDailyLoss: 5,
};

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(defaultRiskSettings);
  const [currentMarket, setCurrentMarket] = useState<Market>('forex');

  const getTodayRiskUsed = useCallback(() => {
    const today = new Date().toDateString();
    return trades
      .filter(t => new Date(t.createdAt).toDateString() === today)
      .reduce((sum, t) => sum + t.riskPercentage, 0);
  }, [trades]);

  const getTodayPnL = useCallback(() => {
    const today = new Date().toDateString();
    return trades
      .filter(t => t.status === 'closed' && t.closedAt && new Date(t.closedAt).toDateString() === today)
      .reduce((sum, t) => sum + (t.result || 0), 0);
  }, [trades]);

  const getOpenTradesCount = useCallback(() => {
    return trades.filter(t => t.status === 'open').length;
  }, [trades]);

  const canOpenNewTrade = useCallback((riskAmount: number): { allowed: boolean; reason?: string } => {
    const riskPercentage = (riskAmount / riskSettings.accountBalance) * 100;

    // Check max risk per trade
    if (riskPercentage > riskSettings.maxRiskPerTrade) {
      return {
        allowed: false,
        reason: `Risco por trade (${riskPercentage.toFixed(2)}%) excede o máximo permitido (${riskSettings.maxRiskPerTrade}%)`,
      };
    }

    // Check max open trades
    if (getOpenTradesCount() >= riskSettings.maxOpenTrades) {
      return {
        allowed: false,
        reason: `Número máximo de trades abertos (${riskSettings.maxOpenTrades}) atingido`,
      };
    }

    // Check daily risk limit
    const todayRisk = getTodayRiskUsed();
    if (todayRisk + riskPercentage > riskSettings.maxDailyRisk) {
      return {
        allowed: false,
        reason: `Risco diário (${(todayRisk + riskPercentage).toFixed(2)}%) excederia o limite (${riskSettings.maxDailyRisk}%)`,
      };
    }

    // Check daily loss limit
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

  const addTrade = useCallback((tradeData: Omit<Trade, 'id' | 'createdAt'>): boolean => {
    const { allowed, reason } = canOpenNewTrade(tradeData.riskAmount);
    if (!allowed) {
      return false;
    }

    const newTrade: Trade = {
      ...tradeData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    setTrades(prev => [newTrade, ...prev]);
    return true;
  }, [canOpenNewTrade]);

  const updateTrade = useCallback((id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const closeTrade = useCallback((id: string, result: number) => {
    setTrades(prev => prev.map(t => 
      t.id === id 
        ? { ...t, status: 'closed' as const, result, closedAt: new Date() } 
        : t
    ));
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateRiskSettings = useCallback((settings: Partial<RiskSettings>) => {
    setRiskSettings(prev => ({ ...prev, ...settings }));
  }, []);

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
      bestTrade: closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.result || 0)) : 0,
      worstTrade: closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.result || 0)) : 0,
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
