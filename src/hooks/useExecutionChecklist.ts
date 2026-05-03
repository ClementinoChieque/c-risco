import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Market } from '@/types/trade';

export type ChecklistCategory = 'context' | 'structure' | 'triggers';

export interface ChecklistItem {
  id: string;
  market: Market;
  category: ChecklistCategory;
  text: string;
  checked: boolean;
  position: number;
}

export function useExecutionChecklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('execution_checklist')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    setItems(
      (data || []).map((d: any) => ({
        id: d.id,
        market: d.market as Market,
        category: (d.category || 'context') as ChecklistCategory,
        text: d.text,
        checked: d.checked,
        position: d.position,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(
    async (market: Market, category: ChecklistCategory, text: string) => {
      if (!user || !text.trim()) return;
      const position = items.filter(i => i.market === market && i.category === category).length;
      const { data } = await (supabase as any)
        .from('execution_checklist')
        .insert({ user_id: user.id, market, category, text: text.trim(), position })
        .select()
        .single();
      if (data) {
        setItems(prev => [
          ...prev,
          {
            id: data.id,
            market,
            category,
            text: data.text,
            checked: data.checked,
            position: data.position,
          },
        ]);
      }
    },
    [user, items],
  );

  const toggleItem = useCallback(async (id: string, checked: boolean) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, checked } : i)));
    await (supabase as any).from('execution_checklist').update({ checked }).eq('id', id);
  }, []);

  const updateItem = useCallback(async (id: string, text: string) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, text } : i)));
    await (supabase as any).from('execution_checklist').update({ text }).eq('id', id);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await (supabase as any).from('execution_checklist').delete().eq('id', id);
  }, []);

  const resetChecks = useCallback(
    async (market: Market) => {
      if (!user) return;
      setItems(prev => prev.map(i => (i.market === market ? { ...i, checked: false } : i)));
      await (supabase as any)
        .from('execution_checklist')
        .update({ checked: false })
        .eq('user_id', user.id)
        .eq('market', market);
    },
    [user],
  );

  return { items, loading, addItem, toggleItem, updateItem, deleteItem, resetChecks };
}
