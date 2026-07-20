import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Trash2, FileSpreadsheet, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTrade } from '@/context/TradeContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = []; let field = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',' || c === ';' || c === '\t') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.some(v => v.trim() !== ''));
}

interface Dataset {
  id: string;
  filename: string;
  headers: string[];
  rows: string[][];
  created_at: string;
}

const marketLabel: Record<string, string> = {
  forex: 'Forex', crypto: 'Cripto', propfirm: 'PropFirm',
};

function parseDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  // Try ISO / native
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  // Try dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(year, Number(mo) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt;
  }
  return null;
}

const LAST_SELECTED_KEY = 'csvViewer:lastSelectedByMarket';

function readLastSelected(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LAST_SELECTED_KEY) || '{}'); } catch { return {}; }
}
function writeLastSelected(map: Record<string, string>) {
  try { localStorage.setItem(LAST_SELECTED_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

export function CsvViewer() {
  const { user } = useAuth();
  const { currentMarket, setCurrentMarket } = useTrade();
  const inputRef = useRef<HTMLInputElement>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMarket, setUploadMarket] = useState<string>(currentMarket);

  useEffect(() => {
    setUploadMarket(currentMarket);
  }, [currentMarket]);

  // Filters
  const [search, setSearch] = useState('');
  const [assetCol, setAssetCol] = useState<string>('__none__');
  const [assetVal, setAssetVal] = useState<string>('__all__');
  const [dateCol, setDateCol] = useState<string>('__none__');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('csv_datasets')
      .select('id, filename, headers, rows, created_at')
      .eq('user_id', user.id)
      .eq('market', currentMarket)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) { toast.error('Erro ao carregar dados CSV'); return; }
    const ds = (data ?? []).map((d: any) => ({
      id: d.id, filename: d.filename,
      headers: d.headers ?? [], rows: d.rows ?? [],
      created_at: d.created_at,
    })) as Dataset[];
    setDatasets(ds);
    const remembered = readLastSelected()[currentMarket];
    const initial = ds.find(d => d.id === remembered)?.id ?? ds[0]?.id ?? null;
    setSelectedId(initial);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id, currentMarket]);

  const uploadFile = async (file: File) => {
    if (!user) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      toast.error('Apenas ficheiros .csv são suportados');
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error('CSV vazio'); return; }
      const [headers, ...body] = rows;
      const { error } = await supabase.from('csv_datasets').insert({
        user_id: user.id,
        market: uploadMarket,
        filename: file.name,
        headers,
        rows: body,
      });
      if (error) throw error;
      toast.success(`CSV carregado para ${marketLabel[uploadMarket]}`);
      if (uploadMarket !== currentMarket) {
        setCurrentMarket(uploadMarket as any);
        // load() will run via the effect on currentMarket change
      } else {
        await load();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao carregar CSV');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('csv_datasets').delete().eq('id', id);
    if (error) { toast.error('Falha ao apagar'); return; }
    toast.success('Removido');
    await load();
  };

  const current = useMemo(
    () => datasets.find(d => d.id === selectedId) ?? null,
    [datasets, selectedId],
  );

  // Auto-detect date & asset columns whenever dataset changes
  useEffect(() => {
    if (!current) return;
    const { headers, rows } = current;
    const sample = rows.slice(0, 30);

    // Date column: header hints + parseable
    let detectedDate = '__none__';
    const dateHints = /date|data|time|hora|timestamp/i;
    for (let i = 0; i < headers.length; i++) {
      const hint = dateHints.test(headers[i] ?? '');
      const parseable = sample.filter(r => parseDate(r[i] ?? '')).length;
      if ((hint && parseable > 0) || parseable / Math.max(sample.length, 1) > 0.6) {
        detectedDate = String(i); break;
      }
    }

    // Asset column: header hints + low cardinality
    let detectedAsset = '__none__';
    const assetHints = /asset|symbol|par|pair|ativo|instrument|ticker/i;
    for (let i = 0; i < headers.length; i++) {
      if (assetHints.test(headers[i] ?? '')) { detectedAsset = String(i); break; }
    }
    if (detectedAsset === '__none__') {
      for (let i = 0; i < headers.length; i++) {
        const vals = new Set(sample.map(r => (r[i] ?? '').trim()).filter(Boolean));
        const numeric = sample.filter(r => !isNaN(Number((r[i] ?? '').replace(',', '.')))).length;
        if (vals.size > 1 && vals.size <= 15 && numeric / Math.max(sample.length, 1) < 0.3) {
          detectedAsset = String(i); break;
        }
      }
    }

    setDateCol(detectedDate);
    setAssetCol(detectedAsset);
    setAssetVal('__all__');
    setDateFrom(''); setDateTo(''); setSearch('');
  }, [current?.id]);

  const assetOptions = useMemo(() => {
    if (!current || assetCol === '__none__') return [] as string[];
    const idx = Number(assetCol);
    const set = new Set<string>();
    for (const r of current.rows) {
      const v = (r[idx] ?? '').trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort();
  }, [current, assetCol]);

  const filteredRows = useMemo(() => {
    if (!current) return [] as string[][];
    const q = search.trim().toLowerCase();
    const dIdx = dateCol === '__none__' ? -1 : Number(dateCol);
    const aIdx = assetCol === '__none__' ? -1 : Number(assetCol);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return current.rows.filter(r => {
      if (q && !r.some(c => (c ?? '').toString().toLowerCase().includes(q))) return false;
      if (aIdx >= 0 && assetVal !== '__all__' && (r[aIdx] ?? '').trim() !== assetVal) return false;
      if (dIdx >= 0 && (from || to)) {
        const d = parseDate(r[dIdx] ?? '');
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
  }, [current, search, assetCol, assetVal, dateCol, dateFrom, dateTo]);

  // Chart uses filtered rows
  const chartData = useMemo(() => {
    if (!current) return { data: [] as any[], label: '', xLabel: '' };
    const { headers } = current;
    const rows = filteredRows;
    let numericIdx = -1;
    for (let c = 0; c < headers.length; c++) {
      const numericCount = rows.reduce((acc, r) => {
        const v = (r[c] ?? '').toString().replace(',', '.').replace(/[^\d.\-]/g, '');
        return acc + (v !== '' && !isNaN(Number(v)) ? 1 : 0);
      }, 0);
      if (numericCount / Math.max(rows.length, 1) > 0.6) { numericIdx = c; break; }
    }
    if (numericIdx === -1) return { data: [], label: '', xLabel: '' };
    const xIdx = dateCol !== '__none__' ? Number(dateCol) : (numericIdx === 0 ? 1 : 0);
    let cumulative = 0;
    const data = rows.slice(0, 200).map((r, i) => {
      const raw = (r[numericIdx] ?? '').toString().replace(',', '.').replace(/[^\d.\-]/g, '');
      const val = Number(raw) || 0;
      cumulative += val;
      return {
        name: (r[xIdx] ?? `#${i + 1}`).toString().slice(0, 20),
        value: val,
        cumulative: Number(cumulative.toFixed(2)),
      };
    });
    return { data, label: headers[numericIdx] || 'Valor', xLabel: headers[xIdx] || '' };
  }, [current, filteredRows, dateCol]);

  const clearFilters = () => {
    setSearch(''); setAssetVal('__all__'); setDateFrom(''); setDateTo('');
  };
  const hasActiveFilters = !!(search || assetVal !== '__all__' || dateFrom || dateTo);

  return (
    <Card className="glass-effect">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Dados CSV — {marketLabel[currentMarket]}
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {datasets.length > 0 && (
            <Select value={selectedId ?? ''} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Escolher ficheiro" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.filename} · {format(new Date(d.created_at), 'dd/MM')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input
            ref={inputRef} type="file" accept=".csv,text/csv"
            className="hidden" onChange={handleFile}
          />
          <Select value={uploadMarket} onValueChange={setUploadMarket}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Mercado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forex">Forex</SelectItem>
              <SelectItem value="crypto">Cripto</SelectItem>
              <SelectItem value="propfirm">PropFirm</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? 'A enviar...' : 'Carregar CSV'}
          </Button>
          {current && (
            <Button size="sm" variant="outline" onClick={() => remove(current.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-[#558C43] bg-[#558C43]/10'
              : 'border-border hover:border-[#558C43]/60 hover:bg-muted/30'
          }`}
        >
          <div className="mb-3">
            <Select value={uploadMarket} onValueChange={setUploadMarket}>
              <SelectTrigger className="h-8 w-[150px] mx-auto text-xs bg-card/50">
                <SelectValue placeholder="Escolher mercado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="crypto">Cripto</SelectItem>
                <SelectItem value="propfirm">PropFirm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            {uploading
              ? 'A enviar...'
              : `Arrasta um CSV aqui ou clica para carregar — ${marketLabel[uploadMarket]}`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ficheiros .csv até ~5MB. Os dados ficam associados ao mercado seleccionado.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : !current ? (
          <p className="text-sm text-muted-foreground">
            Nenhum CSV carregado para {marketLabel[currentMarket]}.
          </p>
        ) : (
          <>
            {/* Filters */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Buscar</Label>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Procurar em todas as colunas..."
                      className="h-9 pl-7 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Coluna de Ativo</Label>
                  <div className="flex gap-2">
                    <Select value={assetCol} onValueChange={(v) => { setAssetCol(v); setAssetVal('__all__'); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— nenhuma —</SelectItem>
                        {current.headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>{h || `Col ${i + 1}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assetCol !== '__none__' && (
                      <Select value={assetVal} onValueChange={setAssetVal}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos</SelectItem>
                          {assetOptions.map(v => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Coluna de Data</Label>
                  <Select value={dateCol} onValueChange={setDateCol}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— nenhuma —</SelectItem>
                      {current.headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Col ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Intervalo de Datas</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date" value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      disabled={dateCol === '__none__'}
                      className="h-9 text-xs"
                    />
                    <Input
                      type="date" value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={dateCol === '__none__'}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {filteredRows.length} de {current.rows.length} linhas
                  {hasActiveFilters && ' (filtradas)'}
                </p>
                {hasActiveFilters && (
                  <Button size="sm" variant="ghost" onClick={clearFilters} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" /> Limpar filtros
                  </Button>
                )}
              </div>
            </div>

            {chartData.data.length > 0 && (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} hide={chartData.data.length > 30} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone" dataKey="cumulative"
                      stroke="#558C43" strokeWidth={2} dot={false}
                      name={`${chartData.label} (acumulado)`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="overflow-auto max-h-[420px] rounded border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    {current.headers.map((h, i) => (
                      <TableHead key={i} className="text-xs whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.slice(0, 500).map((r, ri) => (
                    <TableRow key={ri}>
                      {current.headers.map((_, ci) => (
                        <TableCell key={ci} className="text-xs whitespace-nowrap">
                          {r[ci] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={current.headers.length} className="text-center text-xs text-muted-foreground py-6">
                        Nenhuma linha corresponde aos filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredRows.length > 500 && (
              <p className="text-xs text-muted-foreground">
                A mostrar 500 de {filteredRows.length} linhas.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
