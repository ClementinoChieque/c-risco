import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Trash2, TrendingUp, TrendingDown, ImageIcon, X } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="glass-card border-border/40 overflow-hidden group">
          <div className="relative">
            <img
              src={item.image_url}
              alt={`Análise ${type}`}
              className="w-full h-48 object-cover"
              loading="lazy"
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
          {item.notes && (
            <CardContent className="pt-3 pb-3">
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            </CardContent>
          )}
          <div className="px-6 pb-3">
            <p className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString('pt-AO')}
            </p>
          </div>
        </Card>
      ))}
    </div>
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
