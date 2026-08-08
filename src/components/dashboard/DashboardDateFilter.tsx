import { useState } from 'react';
import { CalendarRange, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTrade } from '@/context/TradeContext';
import { useDateRange } from '@/context/DateRangeContext';
import { toast } from '@/hooks/use-toast';

const MARKET_LABELS: Record<string, string> = {
  forex: 'Forex', crypto: 'Cripto', propfirm: 'PropFirm',
};

function parseDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(year, Number(mo) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt;
  }
  return null;
}

function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DashboardDateFilter() {
  const { user } = useAuth();
  const { currentMarket } = useTrade();
  const { from, to, source, setRange, clear, hasRange } = useDateRange();
  const [loading, setLoading] = useState(false);

  const applyCsvPeriod = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('csv_datasets')
        .select('id, filename, headers, rows, market, created_at')
        .eq('user_id', user.id)
        .eq('market', currentMarket)
        .order('created_at', { ascending: false });

      let selectedId: string | undefined;
      try {
        selectedId = JSON.parse(localStorage.getItem('csvViewer:lastSelectedByMarket') || '{}')[currentMarket];
      } catch { /* ignore */ }

      const ds = (data ?? []).find((d: any) => d.id === selectedId) ?? (data ?? [])[0];
      if (!ds) {
        toast({ title: 'Sem CSV', description: `Nenhum ficheiro CSV associado a ${MARKET_LABELS[currentMarket]}.`, variant: 'destructive' });
        return;
      }

      const headers: string[] = (ds.headers ?? []) as string[];
      const rows: string[][] = (ds.rows ?? []) as string[][];
      const sample = rows.slice(0, 30);
      let dIdx = -1;
      const hints = /date|data|time|hora|timestamp/i;
      for (let i = 0; i < headers.length; i++) {
        const parseable = sample.filter(r => parseDate(r[i] ?? '')).length;
        if (hints.test(headers[i] ?? '') && parseable > sample.length * 0.4) { dIdx = i; break; }
      }
      if (dIdx < 0) {
        for (let i = 0; i < headers.length; i++) {
          const parseable = sample.filter(r => parseDate(r[i] ?? '')).length;
          if (parseable > sample.length * 0.6) { dIdx = i; break; }
        }
      }

      const dates = dIdx >= 0
        ? rows.map(r => parseDate(r[dIdx] ?? '')).filter((d): d is Date => !!d)
        : [];

      if (!dates.length) {
        toast({ title: 'Sem datas no CSV', description: 'Não foi possível detectar uma coluna de datas neste ficheiro.', variant: 'destructive' });
        return;
      }

      const min = new Date(Math.min(...dates.map(d => d.getTime())));
      const max = new Date(Math.max(...dates.map(d => d.getTime())));
      setRange(toInputDate(min), toInputDate(max), ds.filename);
      toast({ title: 'Período aplicado', description: `${ds.filename}: ${toInputDate(min)} → ${toInputDate(max)}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-3 md:p-4 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="flex items-center gap-2 lg:mb-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <p className="stat-label">Período</p>
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground">De</label>
            <Input type="date" value={from} onChange={(e) => setRange(e.target.value, to, source)} className="h-9" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground">Até</label>
            <Input type="date" value={to} onChange={(e) => setRange(from, e.target.value, source)} className="h-9" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={applyCsvPeriod} disabled={loading} className="h-9">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span className="ml-1.5">Período do CSV ({MARKET_LABELS[currentMarket]})</span>
          </Button>
          {hasRange && (
            <Button variant="ghost" size="sm" onClick={clear} className="h-9">
              <X className="h-3.5 w-3.5 mr-1" /> Limpar
            </Button>
          )}
        </div>
      </div>

      {hasRange && (
        <p className="text-[11px] text-muted-foreground mt-2">
          Estatísticas e diário filtrados
          {from && <> de <span className="font-mono">{from}</span></>}
          {to && <> até <span className="font-mono">{to}</span></>}
          {source && <> · a partir de <span className="font-medium">{source}</span></>}
        </p>
      )}
    </div>
  );
}
