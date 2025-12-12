export type Market = 'forex' | 'crypto';

export type TradeDirection = 'long' | 'short';

export type TradeStatus = 'open' | 'closed' | 'cancelled';

export interface Trade {
  id: string;
  market: Market;
  pair: string;
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  leverage?: number; // For crypto
  lotSize?: number; // For forex
  pipValue?: number; // For forex
  riskAmount: number;
  riskPercentage: number;
  potentialProfit: number;
  riskRewardRatio: number;
  status: TradeStatus;
  result?: number; // P&L when closed
  notes?: string;
  createdAt: Date;
  closedAt?: Date;
}

export interface RiskSettings {
  accountBalance: number;
  maxRiskPerTrade: number; // Percentage
  maxDailyRisk: number; // Percentage
  maxOpenTrades: number;
  maxDailyLoss: number; // Percentage
}

export interface DailyStats {
  date: string;
  trades: number;
  wins: number;
  losses: number;
  totalPnL: number;
  riskUsed: number;
}

export interface OverallStats {
  totalTrades: number;
  winRate: number;
  averageRR: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  profitFactor: number;
}

export interface ForexPair {
  symbol: string;
  pipValue: number;
  minLot: number;
  maxLot: number;
}

export interface CryptoPair {
  symbol: string;
  minSize: number;
  maxLeverage: number;
}
