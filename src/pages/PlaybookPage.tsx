import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTradeSetups, TradeSetup } from '@/hooks/useTradeSetups';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, BookMarked, TrendingUp, TrendingDown, Target, DollarSign, Percent } from 'lucide-react';

interface AnalysisRow {
  id: string;
  type: 'win' | 'loss';
  amount: number;
  risk_reward: number;
  setup_id: string | null;
  market: string;
}

const MARKETS = [
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'propfirm', label: 'PropFirm' },
];

function SetupDialog({
  open,
  onOpenChange,
  market,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  market: string;
  editing: TradeSetup | null;
  onSaved: () => void;
}) {
  const { createSetup, updateSetup } = useTradeSetups();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setDescription(editing?.description || '');
      setRules(editing?.rules || '');
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Dê um nome ao setup');
      return;
    }
    setSaving(true);
    const payload = { name: name.trim(), market, description: description.trim() || null, rules: rules.trim() || null };
    const err = editing ? await updateSetup(editing.id, payload) : await createSetup(payload);
    setSaving(false);
    if (err) {
      toast.error('Erro ao guardar: ' + err.message);
      return;
    }
    toast.success(editing ? 'Setup atualizado' : 'Setup criado');
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Setup' : 'Novo Setup'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input placeholder="Ex: Pin bar em zona de supply" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea rows={2} placeholder="Resumo do setup..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Regras / Checklist</Label>
            <Textarea rows={5} placeholder="• Tendência em H4&#10;• Zona de supply marcada&#10;• Pin bar com mecha longa" value={rules} onChange={(e) => setRules(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SetupStatsCard({ setup, analyses, onEdit, onDelete }: {
  setup: TradeSetup;
  analyses: AnalysisRow[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const setupAnalyses = analyses.filter(a => a.setup_id === setup.id);
  const total = setupAnalyses.length;
  const wins = setupAnalyses.filter(a => a.type === 'win').length;
  const losses = total - wins;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const avgRR = total > 0 ? setupAnalyses.reduce((s, a) => s + (a.risk_reward || 0), 0) / total : 0;
  const totalPnL = setupAnalyses.reduce((s, a) => s + (a.type === 'win' ? Math.abs(a.amount) : -Math.abs(a.amount)), 0);

  return (
    <Card className="glass-card border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{setup.name}</span>
            </CardTitle>
            {setup.description && (
              <p className="text-xs text-muted-foreground mt-1">{setup.description}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-md bg-secondary/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
              <Target className="h-3 w-3" /> Trades
            </div>
            <div className="font-mono text-lg">{total}</div>
            <div className="text-[10px] text-muted-foreground">
              <span className="text-green-500">{wins}W</span> / <span className="text-red-500">{losses}L</span>
            </div>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
              <Percent className="h-3 w-3" /> Win Rate
            </div>
            <div className={`font-mono text-lg ${winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
              {winRate.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
              <TrendingUp className="h-3 w-3" /> RR Médio
            </div>
            <div className="font-mono text-lg">{avgRR.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
              <DollarSign className="h-3 w-3" /> Lucro
            </div>
            <div className={`font-mono text-lg ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
            </div>
          </div>
        </div>
        {setup.rules && (
          <div className="rounded-md border border-border/40 bg-background/30 p-2">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Regras</p>
            <pre className="text-xs whitespace-pre-wrap font-sans">{setup.rules}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlaybookPage() {
  const { user } = useAuth();
  const { setups, loading, deleteSetup, refresh } = useTradeSetups();
  const [market, setMarket] = useState('forex');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TradeSetup | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);

  const fetchAnalyses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('trade_analyses')
      .select('id,type,amount,risk_reward,setup_id,market')
      .eq('user_id', user.id);
    setAnalyses((data as AnalysisRow[]) || []);
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  const marketSetups = useMemo(() => setups.filter(s => s.market === market), [setups, market]);
  const marketAnalyses = useMemo(() => analyses.filter(a => a.market === market), [analyses, market]);

  const handleDelete = async (s: TradeSetup) => {
    if (!confirm(`Apagar setup "${s.name}"?`)) return;
    const err = await deleteSetup(s.id);
    if (err) toast.error('Erro ao apagar');
    else {
      toast.success('Setup removido');
      fetchAnalyses();
    }
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s: TradeSetup) => { setEditing(s); setDialogOpen(true); };

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
              <BookMarked className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Playbook
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Documente setups recorrentes e veja estatísticas por setup
            </p>
          </div>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Setup
          </Button>
        </div>

        <Tabs value={market} onValueChange={setMarket}>
          <TabsList className="grid w-full grid-cols-3">
            {MARKETS.map(m => (
              <TabsTrigger key={m.value} value={m.value}>{m.label}</TabsTrigger>
            ))}
          </TabsList>
          {MARKETS.map(m => (
            <TabsContent key={m.value} value={m.value} className="space-y-4 mt-4">
              {loading ? (
                <p className="text-center text-muted-foreground text-sm py-8">A carregar...</p>
              ) : marketSetups.length === 0 ? (
                <Card className="glass-card border-border/40">
                  <CardContent className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                    <BookMarked className="h-10 w-10" />
                    <p className="text-sm">Nenhum setup para {m.label} ainda</p>
                    <Button onClick={openNew} variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" /> Criar primeiro setup
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {marketSetups.map(s => (
                    <SetupStatsCard
                      key={s.id}
                      setup={s}
                      analyses={marketAnalyses}
                      onEdit={() => openEdit(s)}
                      onDelete={() => handleDelete(s)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <SetupDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          market={market}
          editing={editing}
          onSaved={fetchAnalyses}
        />
      </div>
    </MainLayout>
  );
}
