import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { toast } from 'sonner';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
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

export function CsvToPdf() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error('CSV vazio ou inválido');
        return;
      }
      const [head, ...body] = rows;

      const doc = new jsPDF({ orientation: rows[0].length > 6 ? 'landscape' : 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('C-Risco — Dados CSV', 14, 16);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - 14, 16, { align: 'right' });

      autoTable(doc, {
        startY: 32,
        head: [head],
        body,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        margin: { left: 10, right: 10 },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} | ${file.name}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }

      const base = file.name.replace(/\.csv$/i, '');
      doc.save(`${base}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Falha ao converter CSV');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        variant="outline"
        className="gap-2"
        disabled={loading}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {loading ? 'Convertendo...' : 'Dados CSV'}
      </Button>
    </>
  );
}
