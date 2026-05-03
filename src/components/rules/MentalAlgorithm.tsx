import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  RotateCcw,
  Brain,
  CheckCircle2,
  Pencil,
  Check,
  X,
  Globe2,
  LayoutGrid,
  Zap,
} from 'lucide-react';
import {
  useExecutionChecklist,
  ChecklistCategory,
  ChecklistItem,
} from '@/hooks/useExecutionChecklist';
import { Market } from '@/types/trade';
import { cn } from '@/lib/utils';

const MARKETS: { value: Market; label: string }[] = [
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'propfirm', label: 'PropFirm' },
];

const CATEGORIES: {
  value: ChecklistCategory;
  label: string;
  icon: typeof Globe2;
  placeholder: string;
}[] = [
  {
    value: 'context',
    label: 'Contexto do Mercado',
    icon: Globe2,
    placeholder: 'Ex.: Notícias de alto impacto verificadas',
  },
  {
    value: 'structure',
    label: 'Estrutura do Mercado',
    icon: LayoutGrid,
    placeholder: 'Ex.: Tendência H4 alinhada com H1',
  },
  {
    value: 'triggers',
    label: 'Gatilhos de Entrada',
    icon: Zap,
    placeholder: 'Ex.: Confirmação de candle de reversão',
  },
];

interface CategoryBlockProps {
  market: Market;
  category: (typeof CATEGORIES)[number];
  items: ChecklistItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string, checked: boolean) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

function CategoryBlock({
  category,
  items,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
}: CategoryBlockProps) {
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const Icon = category.icon;

  const completed = items.filter(i => i.checked).length;

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText);
    setNewText('');
  };

  const saveEdit = () => {
    if (editingId && editingText.trim()) onUpdate(editingId, editingText.trim());
    setEditingId(null);
    setEditingText('');
  };

  return (
    <div className="rounded-lg border border-border/50 bg-secondary/10 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{category.label}</h3>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-mono text-muted-foreground">
            {completed}/{items.length}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={category.placeholder}
          className="flex-1 h-9"
        />
        <Button onClick={handleAdd} size="icon" disabled={!newText.trim()} className="h-9 w-9">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Nenhuma regra adicionada.
          </p>
        )}
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md border border-border/40 bg-background/40 transition-colors',
              item.checked && 'bg-primary/5 border-primary/30',
            )}
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={c => onToggle(item.id, !!c)}
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
                  onClick={() => {
                    setEditingId(item.id);
                    setEditingText(item.text);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MentalAlgorithm() {
  const { items, loading, addItem, toggleItem, updateItem, deleteItem, resetChecks } =
    useExecutionChecklist();
  const [market, setMarket] = useState<Market>('forex');

  const marketItems = useMemo(() => items.filter(i => i.market === market), [items, market]);
  const completed = marketItems.filter(i => i.checked).length;
  const progress = marketItems.length > 0 ? (completed / marketItems.length) * 100 : 0;

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
            {marketItems.length > 0 && (
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {loading && (
              <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
            )}

            {!loading &&
              CATEGORIES.map(cat => (
                <CategoryBlock
                  key={cat.value}
                  market={m.value}
                  category={cat}
                  items={items.filter(i => i.market === m.value && i.category === cat.value)}
                  onAdd={text => addItem(m.value, cat.value, text)}
                  onToggle={toggleItem}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}

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
