import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Trash2, TrendingUp, TrendingDown, ImageIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTrade } from '@/context/TradeContext';
import { useAuth } from '@/context/AuthContext';

interface TradeAnalysis {
  id: string;
  type: 'win' | 'loss';
  image_url: string;
  notes: string | null;
  amount: number;
  asset_pair: string;
  risk_reward: number;
  lot_size: number;
  risk_percentage: number;
  market: string;
  broker_name: string;
  created_at: string;
}

function AnalysisUploader({ type, onUploaded }: { type: 'win' | 'loss'; onUploaded: () => void }) {
  const { riskSettings, updateRiskSettings, propFirmSettings, updatePropFirmSettings } = useTrade();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [assetPair, setAssetPair] = useState('');
  const [riskReward, setRiskReward] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [riskPct, setRiskPct] = useState('');
  const [market, setMarket] = useState<string>('forex');
  const [brokerName, setBrokerName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!amount || !assetPair || !riskReward) {
      toast.error('Preencha o valor, ativo e RR antes de guardar.');
      return;
    }
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${type}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('trade-analyses')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trade-analyses')
        .getPublicUrl(fileName);

      const parsedAmount = parseFloat(amount);

      const { error: dbError } = await supabase
        .from('trade_analyses')
        .insert({
          user_id: SINGLE_USER_ID,
          type,
          image_url: urlData.publicUrl,
          notes: notes || null,
          amount: parsedAmount,
          asset_pair: assetPair.trim(),
          risk_reward: parseFloat(riskReward),
          lot_size: lotSize ? parseFloat(lotSize) : 0,
          risk_percentage: riskPct ? parseFloat(riskPct) : 0,
          market,
          broker_name: brokerName.trim() || '',
        });

      if (dbError) throw dbError;

      // Update balance based on market
      const delta = type === 'win' ? Math.abs(parsedAmount) : -Math.abs(parsedAmount);

      console.log('[Balance Update]', { type, market, parsedAmount, delta, currentForex: riskSettings.accountBalance, currentCrypto: riskSettings.cryptoAccountBalance });

      if (market === 'forex') {
        const newBalance = riskSettings.accountBalance + delta;
        console.log('[Forex] New balance:', newBalance);
        await updateRiskSettings({ accountBalance: newBalance });
      } else if (market === 'crypto') {
        const newBalance = riskSettings.cryptoAccountBalance + delta;
        console.log('[Crypto] New balance:', newBalance);
        await updateRiskSettings({ cryptoAccountBalance: newBalance });
      } else if (market === 'propfirm') {
        const newBalance = propFirmSettings.fundedBalance + delta;
        console.log('[PropFirm] New balance:', newBalance);
        updatePropFirmSettings({
          ...propFirmSettings,
          fundedBalance: newBalance,
        });
      }

      toast.success(type === 'win' ? 'Análise Win adicionada!' : 'Análise Loss adicionada!');
      setFile(null);
      setNotes('');
      setAmount('');
      setAssetPair('');
      setRiskReward('');
      setLotSize('');
      setRiskPct('');
      setBrokerName('');
      setPreview(null);
      onUploaded();
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="glass-card border-border/40">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label>Imagem da Análise</Label>
          <label className="block cursor-pointer">
            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-6 hover:border-primary/50 transition-colors">
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 rounded-md object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Clique para selecionar</span>
                </div>
              )}
            </div>
            <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>{type === 'win' ? 'Valor Ganho ($)' : 'Valor Perdido ($)'}</Label>
            <Input type="number" step="0.01" placeholder="Ex: 150.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Ativo / Par</Label>
            <Input placeholder="Ex: EUR/USD" value={assetPair} onChange={(e) => setAssetPair(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>RR (Risco/Recompensa)</Label>
            <Input type="number" step="0.1" placeholder="Ex: 2.5" value={riskReward} onChange={(e) => setRiskReward(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Nº de Lotes</Label>
            <Input type="number" step="0.01" placeholder="Ex: 0.10" value={lotSize} onChange={(e) => setLotSize(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Risco (%)</Label>
            <Input type="number" step="0.1" placeholder="Ex: 2.0" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Mercado</Label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="crypto">Cripto</SelectItem>
                <SelectItem value="propfirm">PropFirm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Corretora</Label>
            <Input placeholder="Ex: IC Markets" value={brokerName} onChange={(e) => setBrokerName(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea placeholder="Descreva o que aprendeu com esta operação..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          {uploading ? 'A enviar...' : 'Guardar Análise'}
        </Button>
      </CardContent>
    </Card>
  );
}

function AnalysisGrid({ type }: { type: 'win' | 'loss' }) {
  const [items, setItems] = useState<TradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trade_analyses')
      .select('*')
      .eq('type', type)
      .eq('user_id', SINGLE_USER_ID)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data as unknown as TradeAnalysis[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [type]);

  const handleDelete = async (item: TradeAnalysis) => {
    const path = item.image_url.split('/trade-analyses/')[1];
    if (path) {
      await supabase.storage.from('trade-analyses').remove([decodeURIComponent(path)]);
    }
    await supabase.from('trade_analyses').delete().eq('id', item.id);
    toast.success('Análise removida');
    fetchItems();
  };

  const handleEditStart = (item: TradeAnalysis) => {
    setEditingId(item.id);
    setEditNotes(item.notes || '');
  };

  const handleEditSave = async (id: string) => {
    const { error } = await supabase
      .from('trade_analyses')
      .update({ notes: editNotes || null })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao guardar notas');
    } else {
      toast.success('Notas atualizadas!');
      setEditingId(null);
      fetchItems();
    }
  };

  const marketLabel = (m: string) => {
    if (m === 'forex') return 'Forex';
    if (m === 'crypto') return 'Cripto';
    if (m === 'propfirm') return 'PropFirm';
    return m;
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm text-center py-8">A carregar...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <ImageIcon className="h-10 w-10" />
        <p className="text-sm">Nenhuma análise {type === 'win' ? 'win' : 'loss'} ainda</p>
      </div>
    );
  }

  return (
    <>
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-background/95 backdrop-blur-sm border-border/50">
          <DialogTitle className="sr-only">Imagem ampliada</DialogTitle>
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Análise ampliada" className="w-full h-full max-h-[85vh] object-contain rounded-md" />
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="glass-card border-border/40 overflow-hidden group">
            <div className="relative">
              <img
                src={item.image_url}
                alt={`Análise ${type}`}
                className="w-full h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                loading="lazy"
                onClick={() => setLightboxUrl(item.image_url)}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => handleDelete(item)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="pt-3 pb-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={type === 'win' ? 'default' : 'destructive'} className="font-mono text-xs">
                  {type === 'win' ? '+' : '-'}${Math.abs(item.amount || 0).toFixed(2)}
                </Badge>
                {item.asset_pair && (
                  <Badge variant="secondary" className="text-xs">{item.asset_pair}</Badge>
                )}
                {item.risk_reward > 0 && (
                  <Badge variant="outline" className="text-xs font-mono">RR {item.risk_reward.toFixed(1)}</Badge>
                )}
                {item.lot_size > 0 && (
                  <Badge variant="outline" className="text-xs font-mono">{item.lot_size} lotes</Badge>
                )}
                {item.risk_percentage > 0 && (
                  <Badge variant="outline" className="text-xs font-mono">{item.risk_percentage}%</Badge>
                )}
                <Badge variant="secondary" className="text-xs">{marketLabel(item.market)}</Badge>
                {item.broker_name && (
                  <Badge variant="outline" className="text-xs">{item.broker_name}</Badge>
                )}
              </div>

              {editingId === item.id ? (
                <div className="space-y-2">
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Descreva o que aprendeu..." />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditSave(item.id)}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-h-[1.5rem]"
                  onClick={() => handleEditStart(item)}
                  title="Clique para editar"
                >
                  {item.notes || 'Clique para adicionar notas...'}
                </p>
              )}
            </CardContent>
            <div className="px-6 pb-3">
              <p className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString('pt-AO')}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function TradeAnalyses() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Tabs defaultValue="wins" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="wins" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Gains
        </TabsTrigger>
        <TabsTrigger value="losses" className="gap-2">
          <TrendingDown className="h-4 w-4" />
          Losses
        </TabsTrigger>
      </TabsList>

      <TabsContent value="wins" className="space-y-6">
        <AnalysisUploader type="win" onUploaded={() => setRefreshKey((k) => k + 1)} />
        <AnalysisGrid key={`win-${refreshKey}`} type="win" />
      </TabsContent>

      <TabsContent value="losses" className="space-y-6">
        <AnalysisUploader type="loss" onUploaded={() => setRefreshKey((k) => k + 1)} />
        <AnalysisGrid key={`loss-${refreshKey}`} type="loss" />
      </TabsContent>
    </Tabs>
  );
}
