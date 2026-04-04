import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

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

const marketLabel = (m: string) => {
  if (m === 'forex') return 'Forex';
  if (m === 'crypto') return 'Cripto';
  if (m === 'propfirm') return 'PropFirm';
  return m;
};

export function TradeDiary() {
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trade_analyses')
      .select('*')
      .eq('user_id', SINGLE_USER_ID)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnalyses(data as TradeAnalysis[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
        <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Nenhum trade registrado ainda</p>
        <p className="text-sm text-muted-foreground mt-2">
          Use a secção Negociações para registrar o seu primeiro trade
        </p>
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

      <div className="space-y-4">
        {analyses.map((trade, index) => (
          <div
            key={trade.id}
            className="glass-card rounded-xl p-5 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-lg",
                  trade.type === 'win' ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {trade.type === 'win' ? (
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{trade.asset_pair || 'Sem par'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trade.created_at).toLocaleDateString('pt-AO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Badge variant="secondary" className="text-xs">{marketLabel(trade.market)}</Badge>
                <Badge
                  variant={trade.type === 'win' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {trade.type === 'win' ? 'Gain' : 'Loss'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Valor</p>
                <p className={cn(
                  "font-mono font-medium",
                  trade.type === 'win' ? "text-success" : "text-destructive"
                )}>
                  {trade.type === 'win' ? '+' : '-'}${Math.abs(trade.amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">RR</p>
                <p className="font-mono font-medium text-primary">
                  {trade.risk_reward > 0 ? trade.risk_reward.toFixed(1) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Lotes</p>
                <p className="font-mono font-medium">
                  {trade.lot_size > 0 ? trade.lot_size : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Risco</p>
                <p className="font-mono font-medium">
                  {trade.risk_percentage > 0 ? `${trade.risk_percentage}%` : '-'}
                </p>
              </div>
            </div>

            {trade.broker_name && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase">Corretora</p>
                <p className="font-medium text-sm">{trade.broker_name}</p>
              </div>
            )}

            {trade.notes && (
              <div className="p-3 rounded-lg bg-secondary/30 mb-4">
                <p className="text-sm text-muted-foreground">{trade.notes}</p>
              </div>
            )}

            {trade.image_url && (
              <img
                src={trade.image_url}
                alt={`Análise ${trade.type}`}
                className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                loading="lazy"
                onClick={() => setLightboxUrl(trade.image_url)}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
