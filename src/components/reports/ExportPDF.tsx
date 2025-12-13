import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { useTrade } from '@/context/TradeContext';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export function ExportPDF() {
  const { trades, riskSettings, getOverallStats, getDailyStats } = useTrade();

  const generatePDF = () => {
    const doc = new jsPDF();
    const stats = getOverallStats();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RiskMaster', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth - 20, 25, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(30, 41, 59);
    
    // Account Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo da Conta', 20, 55);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 58, pageWidth - 20, 58);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const accountData = [
      ['Saldo da Conta', `$${riskSettings.accountBalance.toLocaleString()}`],
      ['Risco Máx. por Trade', `${riskSettings.maxRiskPerTrade}%`],
      ['Risco Diário Máx.', `${riskSettings.maxDailyRisk}%`],
      ['Perda Diária Máx.', `${riskSettings.maxDailyLoss}%`],
      ['Trades Abertos Máx.', `${riskSettings.maxOpenTrades}`],
    ];
    
    autoTable(doc, {
      startY: 62,
      head: [],
      body: accountData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40 },
      },
      margin: { left: 20 },
    });
    
    // Performance Statistics
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Estatísticas de Performance', 20, currentY);
    doc.line(20, currentY + 3, pageWidth - 20, currentY + 3);
    
    const performanceData = [
      ['Total de Trades', stats.totalTrades.toString()],
      ['Taxa de Acerto', `${stats.winRate.toFixed(1)}%`],
      ['P&L Total', `$${stats.totalPnL.toFixed(2)}`],
      ['Profit Factor', stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)],
      ['R:R Médio', `1:${stats.averageRR.toFixed(2)}`],
      ['Melhor Trade', `$${stats.bestTrade.toFixed(2)}`],
      ['Pior Trade', `$${stats.worstTrade.toFixed(2)}`],
      ['Sequência Vitórias', stats.consecutiveWins.toString()],
      ['Sequência Derrotas', stats.consecutiveLosses.toString()],
    ];
    
    autoTable(doc, {
      startY: currentY + 7,
      head: [],
      body: performanceData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40 },
      },
      margin: { left: 20 },
    });
    
    // Last 7 Days Summary
    const daily7Y = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo dos Últimos 7 Dias', 20, daily7Y);
    doc.line(20, daily7Y + 3, pageWidth - 20, daily7Y + 3);
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStats = getDailyStats(date.toDateString());
      return [
        format(date, 'dd/MM/yyyy', { locale: ptBR }),
        dayStats.trades.toString(),
        dayStats.wins.toString(),
        dayStats.losses.toString(),
        `$${dayStats.totalPnL.toFixed(2)}`,
        `${dayStats.riskUsed.toFixed(1)}%`,
      ];
    });
    
    autoTable(doc, {
      startY: daily7Y + 7,
      head: [['Data', 'Trades', 'Vitórias', 'Derrotas', 'P&L', 'Risco Usado']],
      body: last7Days,
      theme: 'striped',
      headStyles: { 
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 20, right: 20 },
    });
    
    // Trade History (on new page if there are trades)
    if (trades.length > 0) {
      doc.addPage();
      
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico de Trades', 20, 20);
      
      doc.setTextColor(30, 41, 59);
      
      const tradeData = trades.slice(0, 50).map(trade => [
        format(new Date(trade.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR }),
        trade.market.toUpperCase(),
        trade.pair,
        trade.direction.toUpperCase(),
        `$${trade.riskAmount.toFixed(2)}`,
        `${trade.riskPercentage.toFixed(1)}%`,
        `1:${trade.riskRewardRatio.toFixed(1)}`,
        trade.status === 'closed' ? `$${(trade.result || 0).toFixed(2)}` : 'Aberto',
      ]);
      
      autoTable(doc, {
        startY: 40,
        head: [['Data', 'Mercado', 'Par', 'Direção', 'Risco $', 'Risco %', 'R:R', 'Resultado']],
        body: tradeData,
        theme: 'striped',
        headStyles: { 
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 28 },
          3: { cellWidth: 18 },
          7: { cellWidth: 22 },
        },
        margin: { left: 10, right: 10 },
      });
    }
    
    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} | RiskMaster - Gerenciamento de Risco`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const fileName = `riskmaster-relatorio-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
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
