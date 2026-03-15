import { useState, useMemo } from 'react';
import { useTrade } from '@/context/TradeContext';
import { MarketSelector } from './MarketSelector';
import { PropFirmSettings } from './PropFirmSettings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TradeDirection } from '@/types/trade';
import { toast } from 'sonner';
import { AlertTriangle, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RiskCalculator() {
  const { currentMarket, riskSettings, propFirmSettings, updatePropFirmSettings, addTrade, canOpenNewTrade, isBlocked, blockReason } = useTrade();

  const [pair, setPair] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [riskPercentage, setRiskPercentage] = useState('1');
  const [leverage, setLeverage] = useState('1');
  const [lotSize, setLotSize] = useState('0.01');
  const [notes, setNotes] = useState('');
  
  // Get the correct balance based on market
  const currentBalance = currentMarket === 'crypto' 
    ? riskSettings.cryptoAccountBalance 
    : currentMarket === 'propfirm'
    ? propFirmSettings.fundedBalance
    : riskSettings.accountBalance;

  const calculations = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const riskPct = parseFloat(riskPercentage) || 0;

    if (!entry || !sl) return null;

    const riskAmount = (currentBalance * riskPct) / 100;
    const stopDistance = Math.abs(entry - sl);
    const profitDistance = tp ? Math.abs(tp - entry) : 0;

    let positionSize = 0;
    let potentialProfit = 0;

    if (currentMarket === 'forex' || currentMarket === 'propfirm') {
      const lot = parseFloat(lotSize) || 0.01;
      const pipValue = 10; // Standard pip value for 1 lot
      const pips = stopDistance * (pair?.includes('JPY') ? 100 : 10000);
      positionSize = riskAmount / (pips * pipValue * lot);
      potentialProfit = tp ? (profitDistance / stopDistance) * riskAmount : 0;
    } else {
      const lev = parseFloat(leverage) || 1;
      positionSize = (riskAmount * lev) / stopDistance;
      potentialProfit = tp ? positionSize * profitDistance : 0;
    }

    const riskRewardRatio = profitDistance && stopDistance ? profitDistance / stopDistance : 0;

    return {
      riskAmount,
      positionSize,
      potentialProfit,
      riskRewardRatio,
      stopDistance,
      profitDistance,
    };
  }, [entryPrice, stopLoss, takeProfit, riskPercentage, leverage, lotSize, currentMarket, currentBalance, pair]);

  const handleSubmit = async () => {
    if (!pair || !entryPrice || !stopLoss) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (!calculations) return;

    const { allowed, reason } = canOpenNewTrade(calculations.riskAmount);
    if (!allowed) {
      toast.error(reason);
      return;
    }

    const success = await addTrade({
      market: currentMarket,
      pair,
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit) || 0,
      positionSize: calculations.positionSize,
      leverage: currentMarket === 'crypto' ? parseFloat(leverage) : undefined,
      lotSize: currentMarket === 'forex' ? parseFloat(lotSize) : undefined,
      riskAmount: calculations.riskAmount,
      riskPercentage: parseFloat(riskPercentage),
      potentialProfit: calculations.potentialProfit,
      riskRewardRatio: calculations.riskRewardRatio,
      status: 'open',
      notes,
    });

    if (success) {
      toast.success('Trade registrado com sucesso!');
      // Reset form
      setPair('');
      setEntryPrice('');
      setStopLoss('');
      setTakeProfit('');
      setNotes('');
    } else {
      toast.error('Erro ao registrar trade');
    }
  };

  return (
    <div className="space-y-6">
      <MarketSelector />

      {currentMarket === 'propfirm' && (
        <div className="border-b border-border/40 pb-6">
          <PropFirmSettings 
            settings={propFirmSettings} 
            onSettingsChange={updatePropFirmSettings} 
          />
        </div>
      )}

      {isBlocked && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{blockReason}</p>
        </div>
      )}

      <div className="glass-card rounded-xl p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Par</Label>
            <Input
              type="text"
              placeholder={currentMarket === 'forex' ? 'Ex: EUR/USD' : 'Ex: BTC/USDT'}
              value={pair}
              onChange={(e) => setPair(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Direção</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={direction === 'long' ? 'default' : 'secondary'}
                className={cn(
                  "flex-1",
                  direction === 'long' && "bg-success hover:bg-success/90"
                )}
                onClick={() => setDirection('long')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Long
              </Button>
              <Button
                type="button"
                variant={direction === 'short' ? 'default' : 'secondary'}
                className={cn(
                  "flex-1",
                  direction === 'short' && "bg-destructive hover:bg-destructive/90"
                )}
                onClick={() => setDirection('short')}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Short
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preço de Entrada</Label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Stop Loss</Label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Take Profit (opcional)</Label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Risco (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max={riskSettings.maxRiskPerTrade}
              placeholder="1"
              value={riskPercentage}
              onChange={(e) => setRiskPercentage(e.target.value)}
              className="font-mono"
            />
          </div>

          {currentMarket === 'crypto' && (
            <div className="space-y-2">
              <Label>Alavancagem</Label>
              <Input
                type="number"
                step="1"
                min="1"
                max="125"
                placeholder="1"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="font-mono"
              />
            </div>
          )}

          {(currentMarket === 'forex' || currentMarket === 'propfirm') && (
            <div className="space-y-2">
              <Label>Tamanho do Lote</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.01"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="font-mono"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea
            placeholder="Adicione suas observações sobre este trade..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {calculations && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Risco</p>
              <p className="font-mono text-lg font-bold text-destructive">
                ${calculations.riskAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Tamanho</p>
              <p className="font-mono text-lg font-bold">
                {calculations.positionSize.toFixed(currentMarket === 'forex' ? 4 : 6)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Lucro Potencial</p>
              <p className="font-mono text-lg font-bold text-success">
                ${calculations.potentialProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">R:R</p>
              <p className="font-mono text-lg font-bold text-primary">
                1:{calculations.riskRewardRatio.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isBlocked || !pair || !entryPrice || !stopLoss}
          className="w-full bg-primary hover:bg-primary/90 glow-primary"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Trade
        </Button>
      </div>
    </div>
  );
}
