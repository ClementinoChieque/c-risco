import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RiskSettings } from '@/types/trade';
import { User } from '@supabase/supabase-js';

const defaultRiskSettings: RiskSettings = {
  accountBalance: 10000,
  maxRiskPerTrade: 2,
  maxDailyRisk: 6,
  maxOpenTrades: 5,
  maxDailyLoss: 5,
};

interface DbRiskSettings {
  id: string;
  user_id: string;
  account_balance: number;
  max_risk_per_trade: number;
  max_daily_risk: number;
  max_open_trades: number;
  max_daily_loss: number;
}

export function useRiskSettings(user: User | null) {
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(defaultRiskSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setRiskSettings(defaultRiskSettings);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('risk_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching risk settings:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const dbData = data as DbRiskSettings;
      setRiskSettings({
        accountBalance: Number(dbData.account_balance),
        maxRiskPerTrade: Number(dbData.max_risk_per_trade),
        maxDailyRisk: Number(dbData.max_daily_risk),
        maxOpenTrades: Number(dbData.max_open_trades),
        maxDailyLoss: Number(dbData.max_daily_loss),
      });
    } else {
      // Create default settings for new user
      const { error: insertError } = await supabase
        .from('risk_settings')
        .insert({
          user_id: user.id,
          account_balance: defaultRiskSettings.accountBalance,
          max_risk_per_trade: defaultRiskSettings.maxRiskPerTrade,
          max_daily_risk: defaultRiskSettings.maxDailyRisk,
          max_open_trades: defaultRiskSettings.maxOpenTrades,
          max_daily_loss: defaultRiskSettings.maxDailyLoss,
        });

      if (insertError) {
        console.error('Error creating default risk settings:', insertError);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateRiskSettings = useCallback(async (settings: Partial<RiskSettings>) => {
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    
    if (settings.accountBalance !== undefined) dbUpdates.account_balance = settings.accountBalance;
    if (settings.maxRiskPerTrade !== undefined) dbUpdates.max_risk_per_trade = settings.maxRiskPerTrade;
    if (settings.maxDailyRisk !== undefined) dbUpdates.max_daily_risk = settings.maxDailyRisk;
    if (settings.maxOpenTrades !== undefined) dbUpdates.max_open_trades = settings.maxOpenTrades;
    if (settings.maxDailyLoss !== undefined) dbUpdates.max_daily_loss = settings.maxDailyLoss;

    const { error } = await supabase
      .from('risk_settings')
      .update(dbUpdates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating risk settings:', error);
      return;
    }

    setRiskSettings(prev => ({ ...prev, ...settings }));
  }, [user]);

  return {
    riskSettings,
    loading,
    updateRiskSettings,
    refetch: fetchSettings,
  };
}
