import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTrade } from '@/context/TradeContext';

export function BalanceManager() {
  const { riskSettings, updateRiskSettings, propFirmSettings, updatePropFirmSettings, loading } = useTrade();
  const [forex, setForex] = useState('');
  const [crypto, setCrypto] = useState('');
  const [propfirm, setPropfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Sync inputs once async data is loaded from Supabase
  useEffect(() => {
    if (!loading && !hydrated) {
      setForex(riskSettings.accountBalance.toString());
      setCrypto(riskSettings.cryptoAccountBalance.toString());
      setPropfirm(propFirmSettings.fundedBalance.toString());
      setHydrated(true);
    }
  }, [loading, hydrated, riskSettings.accountBalance, riskSettings.cryptoAccountBalance, propFirmSettings.fundedBalance]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRiskSettings({
        accountBalance: parseFloat(forex) || 0,
        cryptoAccountBalance: parseFloat(crypto) || 0,
      });
      await updatePropFirmSettings({
        ...propFirmSettings,
        fundedBalance: parseFloat(propfirm) || 0,
      });
      toast.success('Saldos atualizados!');
    } catch {
      toast.error('Erro ao atualizar saldos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-card border-border/40">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">Saldo das Contas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Forex ($)</Label>
            <Input type="number" step="0.01" value={forex} onChange={(e) => setForex(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cripto ($)</Label>
            <Input type="number" step="0.01" value={crypto} onChange={(e) => setCrypto(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">PropFirm ($)</Label>
            <Input type="number" step="0.01" value={propfirm} onChange={(e) => setPropfirm(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'A guardar...' : 'Guardar Saldos'}
        </Button>
      </CardContent>
    </Card>
  );
}
