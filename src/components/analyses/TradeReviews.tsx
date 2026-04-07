import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Trash2, TrendingUp, TrendingDown, ImageIcon, X, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

type MarketFilter = 'all' | 'forex' | 'crypto' | 'propfirm';

const MARKET_LABELS: Record<string, string> = {
  all: 'Todos',
  forex: 'Forex',
  crypto: 'Cripto',
  propfirm: 'PropFirm',
};

interface TradeReview {
  id: string;
  type: 'win' | 'loss';
  image_url: string;
  caption: string | null;
  market: string;
  created_at: string;
}

function ReviewUploader({ type, onUploaded }: { type: 'win' | 'loss'; onUploaded: () => void }) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [market, setMarket] = useState<string>('forex');
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
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `reviews/${type}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('trade-analyses')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trade-analyses')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('trade_reviews')
        .insert({
          user_id: user!.id,
          type,
          image_url: urlData.publicUrl,
          caption: caption || null,
          market,
        });

      if (dbError) throw dbError;

      toast.success(type === 'win' ? 'Análise de acerto adicionada!' : 'Análise de erro adicionada!');
      setFile(null);
      setCaption('');
      setPreview(null);
      setMarket('forex');
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
                  <span className="text-sm">Clique para selecionar imagem</span>
                </div>
              )}
            </div>
            <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label>{type === 'win' ? 'Motivo do Acerto' : 'Motivo do Erro'}</Label>
          <Textarea
            placeholder={type === 'win' ? 'Descreva porque acertou nesta operação...' : 'Descreva o que correu mal nesta operação...'}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          {uploading ? 'A enviar...' : 'Guardar Análise'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewGrid({ type, refreshKey, marketFilter }: { type: 'win' | 'loss'; refreshKey: number; marketFilter: MarketFilter }) {
  const { user } = useAuth();
  const [items, setItems] = useState<TradeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from('trade_reviews')
      .select('*')
      .eq('type', type)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (marketFilter !== 'all') {
      query = query.eq('market', marketFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setItems(data as unknown as TradeReview[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [type, refreshKey, marketFilter]);

  const handleDelete = async (item: TradeReview) => {
    const path = item.image_url.split('/trade-analyses/')[1];
    if (path) {
      await supabase.storage.from('trade-analyses').remove([decodeURIComponent(path)]);
    }
    await supabase.from('trade_reviews').delete().eq('id', item.id);
    toast.success('Análise removida');
    fetchItems();
  };

  const handleEditSave = async (id: string) => {
    const { error } = await supabase
      .from('trade_reviews')
      .update({ caption: editCaption || null })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao guardar legenda');
    } else {
      toast.success('Legenda atualizada!');
      setEditingId(null);
      fetchItems();
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm text-center py-8">A carregar...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <ImageIcon className="h-10 w-10" />
        <p className="text-sm">Nenhuma análise {type === 'win' ? 'de acerto' : 'de erro'} {marketFilter !== 'all' ? `em ${MARKET_LABELS[marketFilter]}` : ''} ainda</p>
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
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={type === 'win' ? 'default' : 'destructive'} className="text-xs">
                  {type === 'win' ? 'Acerto' : 'Erro'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {MARKET_LABELS[item.market] || item.market}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString('pt-AO')}
                </span>
              </div>

              {editingId === item.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    rows={3}
                    placeholder={type === 'win' ? 'Motivo do acerto...' : 'Motivo do erro...'}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditSave(item.id)}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-h-[1.5rem] flex items-start gap-1"
                  onClick={() => { setEditingId(item.id); setEditCaption(item.caption || ''); }}
                  title="Clique para editar"
                >
                  <Pencil className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
                  <span>{item.caption || 'Clique para adicionar legenda...'}</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export function TradeReviews() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'forex', 'crypto', 'propfirm'] as MarketFilter[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={marketFilter === m ? 'default' : 'outline'}
            onClick={() => setMarketFilter(m)}
          >
            {MARKET_LABELS[m]}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="wins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wins" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Acertos
          </TabsTrigger>
          <TabsTrigger value="losses" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Erros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wins" className="space-y-6">
          <ReviewUploader type="win" onUploaded={() => setRefreshKey((k) => k + 1)} />
          <ReviewGrid type="win" refreshKey={refreshKey} marketFilter={marketFilter} />
        </TabsContent>

        <TabsContent value="losses" className="space-y-6">
          <ReviewUploader type="loss" onUploaded={() => setRefreshKey((k) => k + 1)} />
          <ReviewGrid type="loss" refreshKey={refreshKey} marketFilter={marketFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
