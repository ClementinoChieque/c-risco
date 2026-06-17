import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface TradeSetup {
  id: string;
  user_id: string;
  name: string;
  market: string;
  description: string | null;
  rules: string | null;
  created_at: string;
  updated_at: string;
}

export function useTradeSetups() {
  const { user } = useAuth();
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSetups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('trade_setups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSetups((data as TradeSetup[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSetups();
  }, [fetchSetups]);

  const createSetup = async (input: Omit<TradeSetup, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('trade_setups').insert({ ...input, user_id: user.id });
    if (!error) await fetchSetups();
    return error;
  };

  const updateSetup = async (id: string, input: Partial<TradeSetup>) => {
    const { error } = await supabase.from('trade_setups').update(input).eq('id', id);
    if (!error) await fetchSetups();
    return error;
  };

  const deleteSetup = async (id: string) => {
    const { error } = await supabase.from('trade_setups').delete().eq('id', id);
    if (!error) await fetchSetups();
    return error;
  };

  return { setups, loading, refresh: fetchSetups, createSetup, updateSetup, deleteSetup };
}
