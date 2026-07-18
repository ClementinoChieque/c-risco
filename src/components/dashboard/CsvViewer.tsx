import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Trash2, FileSpreadsheet } from 'lucide-react';
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

export function CsvViewer() {
  const { user } = useAuth();
  const { currentMarket } = useTrade();
  const inputRef = useRef<HTMLInputElement>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    setSelectedId(ds[0]?.id ?? null);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id, currentMarket]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error('CSV vazio'); return; }
      const [headers, ...body] = rows;
      const { error } = await supabase.from('csv_datasets').insert({
        user_id: user.id,
        market: currentMarket,
        filename: file.name,
        headers,
        rows: body,
      });
      if (error) throw error;
      toast.success('CSV carregado');
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao carregar CSV');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
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

  // Detect first numeric column for chart
  const chartData = useMemo(() => {
    if (!current) return { data: [] as any[], label: '', xLabel: '' };
    const { headers, rows } = current;
    let numericIdx = -1;
    for (let c = 0; c < headers.length; c++) {
      const numericCount = rows.reduce((acc, r) => {
        const v = (r[c] ?? '').toString().replace(',', '.').replace(/[^\d.\-]/g, '');
        return acc + (v !== '' && !isNaN(Number(v)) ? 1 : 0);
      }, 0);
      if (numericCount / Math.max(rows.length, 1) > 0.6) { numericIdx = c; break; }
    }
    if (numericIdx === -1) return { data: [], label: '', xLabel: '' };
    const xIdx = numericIdx === 0 ? 1 : 0;
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
  }, [current]);

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
        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : !current ? (
          <p className="text-sm text-muted-foreground">
            Nenhum CSV carregado para {marketLabel[currentMarket]}. Envia um ficheiro para visualizar.
          </p>
        ) : (
          <>
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
                  {current.rows.slice(0, 500).map((r, ri) => (
                    <TableRow key={ri}>
                      {current.headers.map((_, ci) => (
                        <TableCell key={ci} className="text-xs whitespace-nowrap">
                          {r[ci] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {current.rows.length > 500 && (
              <p className="text-xs text-muted-foreground">
                A mostrar 500 de {current.rows.length} linhas.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
