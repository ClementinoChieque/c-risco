import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { useTrade } from '@/context/TradeContext';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function ExportPDF() {
  const { riskSettings } = useTrade();

  const generatePDF = async () => {
    // Fetch trade_analyses data
    const { data: analyses } = await supabase
      .from('trade_analyses')
      .select('*')
      .order('created_at', { ascending: true });

    if (!analyses) {
      toast.error('Erro ao carregar dados');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // === Stats calculation ===
    const wins = analyses.filter(a => a.type === 'win');
    const losses = analyses.filter(a => a.type === 'loss');
    const totalPnL = analyses.reduce((sum, a) => {
      const val = Math.abs(a.amount || 0);
      return sum + (a.type === 'win' ? val : -val);
    }, 0);
    const grossProfit = wins.reduce((s, a) => s + Math.abs(a.amount || 0), 0);
    const grossLoss = losses.reduce((s, a) => s + Math.abs(a.amount || 0), 0);
    const winRate = analyses.length > 0 ? (wins.length / analyses.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const avgRR = analyses.length > 0
      ? analyses.reduce((s, a) => s + (a.risk_reward || 0), 0) / analyses.length
      : 0;
    const bestTrade = wins.length > 0 ? Math.max(...wins.map(a => Math.abs(a.amount || 0))) : 0;
    const worstTrade = losses.length > 0 ? Math.max(...losses.map(a => Math.abs(a.amount || 0))) : 0;

    // Market breakdown
    const markets = ['forex', 'crypto', 'propfirm'];
    const marketStats = markets.map(m => {
      const mTrades = analyses.filter(a => a.market === m);
      const mWins = mTrades.filter(a => a.type === 'win');
      const mPnL = mTrades.reduce((s, a) => {
        const val = Math.abs(a.amount || 0);
        return s + (a.type === 'win' ? val : -val);
      }, 0);
      return {
        market: m === 'forex' ? 'Forex' : m === 'crypto' ? 'Cripto' : 'PropFirm',
        total: mTrades.length,
        wins: mWins.length,
        losses: mTrades.length - mWins.length,
        pnl: mPnL,
        winRate: mTrades.length > 0 ? (mWins.length / mTrades.length) * 100 : 0,
      };
    });

    // === Header ===
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('C-Risco', 20, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}`, pageWidth - 20, 25, { align: 'right' });

    // === Resumo da Conta ===
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo da Conta', 20, 55);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 58, pageWidth - 20, 58);

    const accountData = [
      ['Saldo Forex', `$${riskSettings.accountBalance.toLocaleString()}`],
      ['Saldo Cripto', `$${riskSettings.cryptoAccountBalance.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 62,
      head: [],
      body: accountData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 40 } },
      margin: { left: 20 },
    });

    // === Performance ===
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Estatísticas de Performance', 20, currentY);
    doc.line(20, currentY + 3, pageWidth - 20, currentY + 3);

    const performanceData = [
      ['Total de Trades', analyses.length.toString()],
      ['Gains', wins.length.toString()],
      ['Losses', losses.length.toString()],
      ['Taxa de Acerto', `${winRate.toFixed(1)}%`],
      ['P&L Total', `$${totalPnL.toFixed(2)}`],
      ['Profit Factor', profitFactor === Infinity ? 'Infinito' : profitFactor.toFixed(2)],
      ['R:R Medio', `1:${avgRR.toFixed(2)}`],
      ['Melhor Trade', `$${bestTrade.toFixed(2)}`],
      ['Pior Trade', `-$${worstTrade.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: currentY + 7,
      head: [],
      body: performanceData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 40 } },
      margin: { left: 20 },
    });

    // === Por Mercado ===
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Desempenho por Mercado', 20, currentY);
    doc.line(20, currentY + 3, pageWidth - 20, currentY + 3);

    autoTable(doc, {
      startY: currentY + 7,
      head: [['Mercado', 'Trades', 'Gains', 'Losses', 'Win Rate', 'P&L']],
      body: marketStats.map(m => [
        m.market,
        m.total.toString(),
        m.wins.toString(),
        m.losses.toString(),
        `${m.winRate.toFixed(1)}%`,
        `$${m.pnl.toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 20, right: 20 },
    });

    // === Ultimos 7 Dias ===
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo dos Últimos 7 Dias', 20, currentY);
    doc.line(20, currentY + 3, pageWidth - 20, currentY + 3);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = date.toDateString();
      const dayTrades = analyses.filter(a => new Date(a.created_at).toDateString() === dateStr);
      const dayWins = dayTrades.filter(a => a.type === 'win');
      const dayLosses = dayTrades.filter(a => a.type === 'loss');
      const dayPnL = dayTrades.reduce((s, a) => {
        const val = Math.abs(a.amount || 0);
        return s + (a.type === 'win' ? val : -val);
      }, 0);
      return [
        format(date, 'dd/MM/yyyy', { locale: ptBR }),
        dayTrades.length.toString(),
        dayWins.length.toString(),
        dayLosses.length.toString(),
        `$${dayPnL.toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: currentY + 7,
      head: [['Data', 'Trades', 'Gains', 'Losses', 'P&L']],
      body: last7Days,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 20, right: 20 },
    });

    // === Historico de Negociacoes ===
    if (analyses.length > 0) {
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico de Negociações', 20, 20);
      doc.setTextColor(30, 41, 59);

      const tradeData = analyses.slice(0, 50).map(a => [
        format(new Date(a.created_at), 'dd/MM/yy HH:mm', { locale: ptBR }),
        a.type === 'win' ? 'Gain' : 'Loss',
        a.market === 'forex' ? 'Forex' : a.market === 'crypto' ? 'Cripto' : 'PropFirm',
        a.asset_pair || '-',
        a.broker_name || '-',
        `$${Math.abs(a.amount || 0).toFixed(2)}`,
        `${(a.lot_size || 0).toFixed(2)}`,
        `${(a.risk_percentage || 0).toFixed(1)}%`,
        `1:${(a.risk_reward || 0).toFixed(1)}`,
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Data', 'Tipo', 'Mercado', 'Ativo', 'Corretora', 'Valor', 'Lotes', 'Risco', 'RR']],
        body: tradeData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 10, right: 10 },
      });
    }

    // === Footer ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Pagina ${i} de ${pageCount} | C-Risco - Gerenciamento de Risco`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const fileName = `C-Risco-relatório-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
    doc.save(fileName);
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <Button onClick={generatePDF} variant="outline" className="gap-2">
      <FileDown className="h-4 w-4" />
      Exportar PDF
    </Button>
  );
}
