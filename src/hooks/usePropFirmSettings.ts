import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PropFirmSettings } from '@/types/trade';

const defaults: PropFirmSettings = {
  name: '',
  fundedBalance: 0,
  profitTarget: 10,
  dailyDrawdown: 5,
  maxDrawdown: 10,
};

export function usePropFirmSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PropFirmSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(defaults);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('propfirm_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          name: data.name ?? '',
          fundedBalance: Number(data.funded_balance) || 0,
          profitTarget: Number(data.profit_target) || 10,
          dailyDrawdown: Number(data.daily_drawdown) || 5,
          maxDrawdown: Number(data.max_drawdown) || 10,
        });
      } else {
        // Migrate any localStorage value once
        try {
          const saved = localStorage.getItem('propFirmSettings');
          const parsed = saved ? JSON.parse(saved) : null;
          const initial = parsed ? { ...defaults, ...parsed } : defaults;
          await supabase.from('propfirm_settings').insert({
            user_id: user.id,
            name: initial.name,
            funded_balance: initial.fundedBalance,
            profit_target: initial.profitTarget,
            daily_drawdown: initial.dailyDrawdown,
            max_drawdown: initial.maxDrawdown,
          });
          setSettings(initial);
        } catch {
          setSettings(defaults);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const updateSettings = useCallback(async (next: PropFirmSettings) => {
    setSettings(next);
    if (!user) return;
    await supabase.from('propfirm_settings').upsert({
      user_id: user.id,
      name: next.name,
      funded_balance: next.fundedBalance,
      profit_target: next.profitTarget,
      daily_drawdown: next.dailyDrawdown,
      max_drawdown: next.maxDrawdown,
    }, { onConflict: 'user_id' });
  }, [user]);

  return { propFirmSettings: settings, updatePropFirmSettings: updateSettings, loading };
}
