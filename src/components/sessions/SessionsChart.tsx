import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, HistogramSeries, LineSeries } from 'lightweight-charts';

function getWATHour(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wat = new Date(utc + 3600000);
  return wat.getHours() + wat.getMinutes() / 60;
}

interface SessionBlock {
  name: string;
  start: number;
  end: number;
  color: string;
  opacity: number;
}

const sessionBlocks: SessionBlock[] = [
  { name: 'Londres', start: 8, end: 17, color: '#0ea5e9', opacity: 0.25 },
  { name: 'Nova Iorque', start: 13, end: 22, color: '#a855f7', opacity: 0.25 },
  { name: 'Overlap', start: 13, end: 17, color: '#22c55e', opacity: 0.35 },
];

// Simulated volume profile per hour (0-23) representing typical activity
const hourlyVolume: number[] = [
  10, 8, 6, 5, 5, 6, 8, 12, // 00-07 (Tokyo winds down)
  45, 60, 70, 65, 55, 80, 95, 90, // 08-15 (London + overlap peak)
  75, 50, 40, 35, 30, 25, 15, 12, // 16-23 (NY winds down)
];

export function SessionsChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--card')
      .trim();

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(215, 20%, 55%)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: {
        visible: true,
        borderColor: 'rgba(255,255,255,0.08)',
      },
      timeScale: {
        visible: true,
        borderColor: 'rgba(255,255,255,0.08)',
        tickMarkFormatter: (time: number) => `${String(time).padStart(2, '0')}:00`,
      },
      crosshair: {
        horzLine: { color: 'rgba(255,255,255,0.15)', style: 2 },
        vertLine: { color: 'rgba(255,255,255,0.15)', style: 2 },
      },
      handleScale: false,
      handleScroll: false,
    });

    chartRef.current = chart;

    // Add session background markers using histogram series for each session
    sessionBlocks.forEach((session) => {
      const series = chart.addHistogramSeries({
        color: session.color,
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        lastValueVisible: false,
        priceLineVisible: false,
      });

      const data = [];
      for (let h = 0; h < 24; h++) {
        const inSession = session.start < session.end
          ? h >= session.start && h < session.end
          : h >= session.start || h < session.end;

        if (inSession) {
          data.push({
            time: h as any,
            value: hourlyVolume[h],
            color: session.color + Math.round(session.opacity * 255).toString(16).padStart(2, '0'),
          });
        }
      }
      series.setData(data);
    });

    // Current hour marker line
    const currentHour = getWATHour();
    const markerSeries = chart.addLineSeries({
      color: 'hsl(185, 100%, 50%)',
      lineWidth: 2,
      lineStyle: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    markerSeries.setData([
      { time: Math.floor(currentHour) as any, value: 0 },
      { time: Math.floor(currentHour) as any, value: 100 },
    ]);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="glass-card rounded-xl p-4 animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Mapa de Sessões (WAT)
        </h3>
        <div className="flex items-center gap-3">
          {sessionBlocks.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[10px] text-muted-foreground font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
    </div>
  );
}
