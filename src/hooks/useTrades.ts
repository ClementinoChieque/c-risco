import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade, Market } from '@/types/trade';

// Fixed user ID for single-user mode
const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

interface DbTrade {
  id: string;
  user_id: string;
  market: string;
  pair: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  position_size: number;
  leverage: number | null;
  lot_size: number | null;
  pip_value: number | null;
  risk_amount: number;
  risk_percentage: number;
  potential_profit: number;
  risk_reward_ratio: number;
  status: string;
  result: number | null;
  notes: string | null;
  created_at: string;
  closed_at: string | null;
}

const mapDbToTrade = (dbTrade: DbTrade): Trade => ({
  id: dbTrade.id,
  market: dbTrade.market as Market,
  pair: dbTrade.pair,
  direction: dbTrade.direction as 'long' | 'short',
  entryPrice: Number(dbTrade.entry_price),
  stopLoss: Number(dbTrade.stop_loss),
  takeProfit: Number(dbTrade.take_profit),
  positionSize: Number(dbTrade.position_size),
  leverage: dbTrade.leverage ? Number(dbTrade.leverage) : undefined,
  lotSize: dbTrade.lot_size ? Number(dbTrade.lot_size) : undefined,
  pipValue: dbTrade.pip_value ? Number(dbTrade.pip_value) : undefined,
  riskAmount: Number(dbTrade.risk_amount),
  riskPercentage: Number(dbTrade.risk_percentage),
  potentialProfit: Number(dbTrade.potential_profit),
  riskRewardRatio: Number(dbTrade.risk_reward_ratio),
  status: dbTrade.status as 'open' | 'closed' | 'cancelled',
  result: dbTrade.result ? Number(dbTrade.result) : undefined,
  notes: dbTrade.notes ?? undefined,
  createdAt: new Date(dbTrade.created_at),
  closedAt: dbTrade.closed_at ? new Date(dbTrade.closed_at) : undefined,
});

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
    } else {
      setTrades((data as DbTrade[]).map(mapDbToTrade));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const addTrade = useCallback(async (tradeData: Omit<Trade, 'id' | 'createdAt'>): Promise<boolean> => {
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: SINGLE_USER_ID,
        market: tradeData.market,
        pair: tradeData.pair,
        direction: tradeData.direction,
        entry_price: tradeData.entryPrice,
        stop_loss: tradeData.stopLoss,
        take_profit: tradeData.takeProfit,
        position_size: tradeData.positionSize,
        leverage: tradeData.leverage ?? null,
        lot_size: tradeData.lotSize ?? null,
        pip_value: tradeData.pipValue ?? null,
        risk_amount: tradeData.riskAmount,
        risk_percentage: tradeData.riskPercentage,
        potential_profit: tradeData.potentialProfit,
        risk_reward_ratio: tradeData.riskRewardRatio,
        status: tradeData.status,
        notes: tradeData.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding trade:', error);
      return false;
    }

    setTrades(prev => [mapDbToTrade(data as DbTrade), ...prev]);
    return true;
  }, []);

  const updateTrade = useCallback(async (id: string, updates: Partial<Trade>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.entryPrice !== undefined) dbUpdates.entry_price = updates.entryPrice;
    if (updates.stopLoss !== undefined) dbUpdates.stop_loss = updates.stopLoss;
    if (updates.takeProfit !== undefined) dbUpdates.take_profit = updates.takeProfit;
    if (updates.positionSize !== undefined) dbUpdates.position_size = updates.positionSize;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.result !== undefined) dbUpdates.result = updates.result;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.closedAt !== undefined) dbUpdates.closed_at = updates.closedAt?.toISOString();

    const { error } = await supabase
      .from('trades')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating trade:', error);
      return;
    }

    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const closeTrade = useCallback(async (id: string, result: number) => {
    const { error } = await supabase
      .from('trades')
      .update({
        status: 'closed',
        result,
        closed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error closing trade:', error);
      return;
    }

    setTrades(prev => prev.map(t => 
      t.id === id 
        ? { ...t, status: 'closed' as const, result, closedAt: new Date() } 
        : t
    ));
  }, []);

  const deleteTrade = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting trade:', error);
      return;
    }

    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    trades,
    loading,
    addTrade,
    updateTrade,
    closeTrade,
    deleteTrade,
    refetch: fetchTrades,
  };
}
