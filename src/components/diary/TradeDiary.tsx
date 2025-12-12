import { useState } from 'react';
import { useTrade } from '@/context/TradeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUpRight, ArrowDownRight, X, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TradeDiary() {
  const { trades, closeTrade, deleteTrade } = useTrade();
  const [closeResult, setCloseResult] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const handleClose = (id: string) => {
    const result = parseFloat(closeResult);
    if (isNaN(result)) {
      toast.error('Digite um valor válido');
      return;
    }
    closeTrade(id, result);
    setCloseResult('');
    setSelectedTradeId(null);
    toast.success('Trade fechado com sucesso!');
  };

  const handleDelete = (id: string) => {
    deleteTrade(id);
    toast.success('Trade removido');
  };

  if (trades.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
        <p className="text-muted-foreground">Nenhum trade registrado ainda</p>
        <p className="text-sm text-muted-foreground mt-2">
          Use a calculadora para registrar seu primeiro trade
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade, index) => (
        <div
          key={trade.id}
          className="glass-card rounded-xl p-5 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-lg",
                trade.direction === 'long' ? "bg-success/10" : "bg-destructive/10"
              )}>
                {trade.direction === 'long' ? (
                  <ArrowUpRight className="h-5 w-5 text-success" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{trade.pair}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(trade.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={trade.market === 'forex' ? 'default' : 'secondary'} className="capitalize">
                {trade.market}
              </Badge>
              <Badge 
                variant={trade.status === 'open' ? 'outline' : 'secondary'}
                className={cn(
                  trade.status === 'closed' && trade.result && trade.result > 0 && "bg-success/10 text-success border-success/20",
                  trade.status === 'closed' && trade.result && trade.result < 0 && "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {trade.status === 'open' ? 'Aberto' : 'Fechado'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Entrada</p>
              <p className="font-mono font-medium">{trade.entryPrice}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Stop Loss</p>
              <p className="font-mono font-medium text-destructive">{trade.stopLoss}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Take Profit</p>
              <p className="font-mono font-medium text-success">{trade.takeProfit || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">R:R</p>
              <p className="font-mono font-medium text-primary">1:{trade.riskRewardRatio.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Risco</p>
              <p className="font-mono font-medium">${trade.riskAmount.toFixed(2)} ({trade.riskPercentage}%)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Tamanho</p>
              <p className="font-mono font-medium">{trade.positionSize.toFixed(6)}</p>
            </div>
            {trade.leverage && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Alavancagem</p>
                <p className="font-mono font-medium">{trade.leverage}x</p>
              </div>
            )}
            {trade.lotSize && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Lote</p>
                <p className="font-mono font-medium">{trade.lotSize}</p>
              </div>
            )}
          </div>

          {trade.notes && (
            <div className="p-3 rounded-lg bg-secondary/30 mb-4">
              <p className="text-sm text-muted-foreground">{trade.notes}</p>
            </div>
          )}

          {trade.status === 'closed' && trade.result !== undefined && (
            <div className={cn(
              "p-4 rounded-lg text-center",
              trade.result > 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              <p className="text-sm text-muted-foreground">Resultado</p>
              <p className={cn(
                "font-mono text-2xl font-bold",
                trade.result > 0 ? "text-success" : "text-destructive"
              )}>
                {trade.result > 0 ? '+' : ''}${trade.result.toFixed(2)}
              </p>
            </div>
          )}

          {trade.status === 'open' && (
            <div className="flex gap-2 mt-4">
              <Dialog open={selectedTradeId === trade.id} onOpenChange={(open) => !open && setSelectedTradeId(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedTradeId(trade.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Fechar Trade
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fechar Trade - {trade.pair}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Resultado (valor positivo para lucro, negativo para prejuízo)
                      </p>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Ex: 50.00 ou -30.00"
                        value={closeResult}
                        onChange={(e) => setCloseResult(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <Button onClick={() => handleClose(trade.id)} className="w-full">
                      Confirmar Fechamento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(trade.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
