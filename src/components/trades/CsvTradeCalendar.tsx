import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Market = 'forex' | 'crypto' | 'propfirm';

const MARKET_LABELS: Record<Market, string> = {
  forex: 'Forex',
  crypto: 'Cripto',
  propfirm: 'PropFirm',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface Dataset {
  id: string;
  filename: string;
  headers: string[];
  rows: string[][];
  market: Market;
  created_at: string;
  updated_at?: string;
}

interface DayCell {
  wins: number;
  losses: number;
  total: number;
  rows: { label: string; value: number; raw: string[] }[];
}

function toNum(v: any): number {
  const s = (v ?? '').toString().replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
  return s === '' || isNaN(Number(s)) ? 0 : Number(s);
}

function parseCsvDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(year, Number(mo) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt;
  }
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

function detectColumns(headers: string[], rows: string[][]) {
  const pnlNetIdx = headers.findIndex((h) =>
    /closed\s*p[&/]?l\s*net|p[&/]?l\s*net/i.test((h ?? '').toString().trim())
  );
  const pnlIdx = headers.findIndex((h, i) => {
    const s = (h ?? '').toString().trim();
    return i !== pnlNetIdx && /closed\s*p[&/]?l|^\s*p[&/]?l\s*$|pnl|profit|lucro|resultado/i.test(s);
  });

  const sample = rows.slice(0, 30);
  let dateIdx = -1;
  const dateHints = /date|data|time|hora|timestamp/i;
  for (let i = 0; i < headers.length; i++) {
    const parseable = sample.filter((r) => parseCsvDate(r[i] ?? '')).length;
    if (dateHints.test(headers[i] ?? '') && parseable > sample.length * 0.4) { dateIdx = i; break; }
  }
  if (dateIdx < 0) {
    for (let i = 0; i < headers.length; i++) {
      const parseable = sample.filter((r) => parseCsvDate(r[i] ?? '')).length;
      if (parseable > sample.length * 0.6) { dateIdx = i; break; }
    }
  }

  const assetIdx = headers.findIndex((h) => /symbol|contract|pair|asset|ativo|instrument|mercado/i.test((h ?? '').toString()));

  return { pnlNetIdx, pnlIdx, dateIdx, assetIdx };
}

const LAST_SELECTED_KEY = 'csvViewer:lastSelectedByMarket';

export function CsvTradeCalendar() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<Market>('forex');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const onChanged = () => setRefreshKey((k) => k + 1);
    window.addEventListener('csv-datasets:changed', onChanged);
    return () => window.removeEventListener('csv-datasets:changed', onChanged);
  }, []);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from('csv_datasets')
        .select('id, filename, headers, rows, market, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setDatasets((data ?? []) as unknown as Dataset[]);
      setLoading(false);
    }
    load();
  }, [user, refreshKey]);

  // Um dataset activo por mercado (o seleccionado no visualizador, senão o mais recente)
  const activeByMarket = useMemo(() => {
    let selected: Record<string, string> = {};
    try { selected = JSON.parse(localStorage.getItem(LAST_SELECTED_KEY) || '{}'); } catch { /* ignore */ }
    const map: Partial<Record<Market, Dataset>> = {};
    datasets.forEach((d) => {
      const m = d.market as Market;
      if (!MARKET_LABELS[m]) return;
      const chosen = selected[m];
      if (chosen) {
        if (d.id === chosen) map[m] = d;
      } else if (!map[m]) map[m] = d;
    });
    datasets.forEach((d) => {
      const m = d.market as Market;
      if (MARKET_LABELS[m] && !map[m]) map[m] = d;
    });
    return map;
  }, [datasets]);

  const active = activeByMarket[market];

  const { days, monthTotal, monthWins, monthLosses } = useMemo(() => {
    const map = new Map<string, DayCell>();
    let total = 0, wins = 0, losses = 0;
    if (active) {
      const headers = active.headers ?? [];
      const rows = active.rows ?? [];
      const { pnlNetIdx, pnlIdx, dateIdx, assetIdx } = detectColumns(headers, rows);
      const refIdx = pnlNetIdx >= 0 ? pnlNetIdx : pnlIdx;
      if (dateIdx >= 0 && refIdx >= 0) {
        rows.forEach((r) => {
          const dt = parseCsvDate(r[dateIdx] ?? '');
          if (!dt || dt.getFullYear() !== year || dt.getMonth() !== month) return;
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          const cell = map.get(key) || { wins: 0, losses: 0, total: 0, rows: [] };
          const value = toNum(r[refIdx]);
          cell.total += value;
          if (value > 0) { cell.wins++; wins++; }
          else if (value < 0) { cell.losses++; losses++; }
          cell.rows.push({ label: assetIdx >= 0 ? (r[assetIdx] ?? '—') : `Linha ${cell.rows.length + 1}`, value, raw: r });
          total += value;
          map.set(key, cell);
        });
      }
    }
    return { days: map, monthTotal: total, monthWins: wins, monthLosses: losses };
  }, [active, year, month]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [year, month]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const formatDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return `${d} de ${MONTHS[m - 1]} de ${y}`;
  };

  const selectedCell = selectedDate ? days.get(selectedDate) : undefined;

  return (
    <>
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">Calendário de Trades (CSV)</CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium min-w-[110px] sm:min-w-[140px] text-center">
                {MONTHS[month]} {year}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Tabs value={market} onValueChange={(v) => { setMarket(v as Market); setSelectedDate(null); }}>
            <TabsList className="w-full">
              {(Object.keys(MARKET_LABELS) as Market[]).map((m) => (
                <TabsTrigger key={m} value={m} className="flex-1 text-xs">
                  {MARKET_LABELS[m]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <p className="text-muted-foreground text-sm text-center py-8">A carregar...</p>
          ) : !active ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Sem dados CSV para {MARKET_LABELS[market]}. Faça upload no Dashboard.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mt-3 mb-3 text-[11px] sm:text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1 max-w-full">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate" title={active.filename}>{active.filename}</span>
                </Badge>
                <span className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="h-3 w-3" />{monthWins}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <TrendingDown className="h-3 w-3" />{monthLosses}
                </span>
                <span className={monthTotal >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                  {monthTotal >= 0 ? '+' : '-'}${Math.abs(monthTotal).toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} className="aspect-square" />;
                  const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const cell = days.get(key);
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={key}
                      onClick={() => cell && setSelectedDate(key)}
                      className={`aspect-square rounded-md border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                        cell ? 'cursor-pointer' : ''
                      } ${
                        isToday
                          ? 'border-primary bg-primary/10'
                          : cell
                          ? cell.total >= 0
                            ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
                            : 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                          : 'border-border/30 hover:bg-accent/50'
                      }`}
                    >
                      <span className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</span>
                      {cell && (
                        <span className={`text-[9px] font-mono ${cell.total >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {cell.total >= 0 ? '+' : '-'}{Math.abs(cell.total).toFixed(0)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-4 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
                  <span>Positivo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" />
                  <span>Negativo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm border border-primary bg-primary/10" />
                  <span>Hoje</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base">
              {MARKET_LABELS[market]} — {selectedDate && formatDate(selectedDate)}
            </DialogTitle>
          </DialogHeader>

          {!selectedCell ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhum registo neste dia.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{selectedCell.rows.length} operações</span>
                <span className={`font-bold ${selectedCell.total >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {selectedCell.total >= 0 ? '+' : '-'}${Math.abs(selectedCell.total).toFixed(2)}
                </span>
              </div>
              {selectedCell.rows.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    r.value >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground truncate mr-2">{r.label}</span>
                  <span className={`text-sm font-bold font-mono ${r.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {r.value >= 0 ? '+' : '-'}${Math.abs(r.value).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
