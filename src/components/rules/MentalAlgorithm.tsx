import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, RotateCcw, Brain, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import { useExecutionChecklist } from '@/hooks/useExecutionChecklist';
import { Market } from '@/types/trade';
import { cn } from '@/lib/utils';

const MARKETS: { value: Market; label: string }[] = [
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'propfirm', label: 'PropFirm' },
];

export function MentalAlgorithm() {
  const { items, loading, addItem, toggleItem, updateItem, deleteItem, resetChecks } =
    useExecutionChecklist();
  const [market, setMarket] = useState<Market>('forex');
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const marketItems = useMemo(() => items.filter(i => i.market === market), [items, market]);
  const completed = marketItems.filter(i => i.checked).length;
  const progress = marketItems.length > 0 ? (completed / marketItems.length) * 100 : 0;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    await addItem(market, newText);
    setNewText('');
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEdit = async () => {
    if (editingId && editingText.trim()) {
      await updateItem(editingId, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  };

  return (
    <Card className="glass-card p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base md:text-lg font-bold">Algoritmo Mental</h2>
            <p className="text-xs text-muted-foreground">
              Checklist das suas estratégias antes de executar
            </p>
          </div>
        </div>
        {marketItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {completed}/{marketItems.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetChecks(market)}
              className="h-8 px-2"
              title="Reiniciar checklist"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={market} onValueChange={v => setMarket(v as Market)}>
        <TabsList className="grid w-full grid-cols-3">
          {MARKETS.map(m => (
            <TabsTrigger key={m.value} value={m.value}>
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {MARKETS.map(m => (
          <TabsContent key={m.value} value={m.value} className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Ex.: Confirmar tendência no H4"
                className="flex-1"
              />
              <Button onClick={handleAdd} size="icon" disabled={!newText.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {marketItems.length > 0 && (
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {loading && (
                <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
              )}
              {!loading && marketItems.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhuma regra adicionada para {m.label}.
                </p>
              )}
              {marketItems.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-secondary/20 transition-colors',
                    item.checked && 'bg-primary/5 border-primary/30',
                  )}
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={c => toggleItem(item.id, !!c)}
                  />
                  {editingId === item.id ? (
                    <>
                      <Input
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="h-7 text-sm"
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          'flex-1 text-sm',
                          item.checked && 'line-through text-muted-foreground',
                        )}
                      >
                        {item.text}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => startEdit(item.id, item.text)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {marketItems.length > 0 && progress === 100 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Checklist completo. Pronto para executar.
                </span>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
