import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Trash2, TrendingUp, TrendingDown, ImageIcon, X, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

interface TradeAnalysis {
  id: string;
  type: 'win' | 'loss';
  image_url: string;
  notes: string | null;
  created_at: string;
}

function AnalysisUploader({ type, onUploaded }: { type: 'win' | 'loss'; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
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
      const fileName = `${type}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('trade-analyses')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trade-analyses')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('trade_analyses')
        .insert({
          user_id: SINGLE_USER_ID,
          type,
          image_url: urlData.publicUrl,
          notes: notes || null,
        });

      if (dbError) throw dbError;

      toast.success(type === 'win' ? 'Análise Win adicionada!' : 'Análise Loss adicionada!');
      setFile(null);
      setNotes('');
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
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer">
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
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea
            placeholder="Descreva o que aprendeu com esta operação..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
      setItems(data as TradeAnalysis[]);
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
            <img
              src={lightboxUrl}
              alt="Análise ampliada"
              className="w-full h-full max-h-[85vh] object-contain rounded-md"
            />
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
              {editingId === item.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    placeholder="Descreva o que aprendeu..."
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

function WidgetsManager() {
  const [widgets, setWidgets] = useState<{ id: string; name: string; embedUrl: string }[]>(() => {
    try {
      const saved = localStorage.getItem('broker-widgets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');

  const saveWidgets = (updated: typeof widgets) => {
    setWidgets(updated);
    localStorage.setItem('broker-widgets', JSON.stringify(updated));
  };

  const extractSrcFromEmbed = (input: string): string => {
    const trimmed = input.trim();
    // If it's an iframe embed code, extract the src
    const srcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (srcMatch) return srcMatch[1];
    // Otherwise treat as direct URL
    return trimmed;
  };

  const handleAdd = () => {
    if (!name.trim() || !embedUrl.trim()) {
      toast.error('Preencha o nome e o link do widget');
      return;
    }
    const resolvedUrl = extractSrcFromEmbed(embedUrl.trim());
    const newWidget = { id: Date.now().toString(), name: name.trim(), embedUrl: resolvedUrl };
    saveWidgets([...widgets, newWidget]);
    setName('');
    setEmbedUrl('');
    toast.success('Widget adicionado!');
  };

  const handleDelete = (id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
    toast.success('Widget removido');
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/40">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Nome do Widget</Label>
            <Input
              placeholder="Ex: TradingView, Myfxbook..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Link do Widget (URL ou código embed)</Label>
            <Textarea
              placeholder="Cole a URL do widget ou o código embed (<iframe ...>)"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Adicionar Widget
          </Button>
        </CardContent>
      </Card>

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <LayoutGrid className="h-10 w-10" />
          <p className="text-sm">Nenhum widget adicionado ainda</p>
          <p className="text-xs">Adicione widgets da sua corretora acima</p>
        </div>
      ) : (
        <div className="space-y-4">
          {widgets.map((widget) => (
            <Card key={widget.id} className="glass-card border-border/40 overflow-hidden">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{widget.name}</h3>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(widget.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden border border-border/40 bg-background">
                  <iframe
                    src={widget.embedUrl}
                    className="w-full h-[400px]"
                    title={widget.name}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    loading="lazy"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function TradeAnalyses() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Tabs defaultValue="wins" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="wins" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Gains
        </TabsTrigger>
        <TabsTrigger value="losses" className="gap-2">
          <TrendingDown className="h-4 w-4" />
          Losses
        </TabsTrigger>
        <TabsTrigger value="widgets" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          Widgets
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

      <TabsContent value="widgets" className="space-y-6">
        <WidgetsManager />
      </TabsContent>
    </Tabs>
  );
}
