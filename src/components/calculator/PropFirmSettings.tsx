import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Target, TrendingDown, AlertTriangle } from 'lucide-react';
import { PropFirmSettings as PropFirmSettingsType } from '@/types/trade';

interface PropFirmSettingsProps {
  settings: PropFirmSettingsType;
  onSettingsChange: (settings: PropFirmSettingsType) => void;
}

export function PropFirmSettings({ settings, onSettingsChange }: PropFirmSettingsProps) {
  const handleChange = (field: keyof PropFirmSettingsType, value: string) => {
    const numericFields = ['fundedBalance', 'profitTarget', 'dailyDrawdown', 'maxDrawdown'];
    const newValue = numericFields.includes(field) ? parseFloat(value) || 0 : value;
    onSettingsChange({ ...settings, [field]: newValue });
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Configurações da PropFirm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Nome da PropFirm
            </Label>
            <Input
              type="text"
              placeholder="Ex: FTMO, MyForexFunds..."
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Saldo Financiado ($)
            </Label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={settings.fundedBalance || ''}
              onChange={(e) => handleChange('fundedBalance', e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-success" />
              Meta de Lucros (%)
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="10"
              value={settings.profitTarget || ''}
              onChange={(e) => handleChange('profitTarget', e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-warning" />
              Drawdown Diário (%)
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="5"
              value={settings.dailyDrawdown || ''}
              onChange={(e) => handleChange('dailyDrawdown', e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Drawdown Máximo (%)
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="10"
              value={settings.maxDrawdown || ''}
              onChange={(e) => handleChange('maxDrawdown', e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        {settings.fundedBalance > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/30 mt-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Meta de Lucro</p>
              <p className="font-mono text-lg font-bold text-success">
                ${((settings.fundedBalance * settings.profitTarget) / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Limite Diário</p>
              <p className="font-mono text-lg font-bold text-warning">
                -${((settings.fundedBalance * settings.dailyDrawdown) / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Limite Máximo</p>
              <p className="font-mono text-lg font-bold text-destructive">
                -${((settings.fundedBalance * settings.maxDrawdown) / 100).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}