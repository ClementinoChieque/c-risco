import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, HistogramSeries, LineSeries } from 'lightweight-charts';

function getWATHour(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wat = new Date(utc + 3600000);
  return wat.getHours() + wat.getMinutes() / 60;
}

function getTimezoneOffsetHours(tz: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', hour12: false, day: 'numeric', month: 'numeric', year: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const localHour = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const localDay = Number(parts.find(p => p.type === 'day')?.value ?? 0);
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', hour: 'numeric', hour12: false, day: 'numeric', month: 'numeric', year: 'numeric',
  });
  const utcParts = utcFormatter.formatToParts(now);
  const utcHour = Number(utcParts.find(p => p.type === 'hour')?.value ?? 0);
  const utcDay = Number(utcParts.find(p => p.type === 'day')?.value ?? 0);
  let diff = localHour - utcHour + (localDay - utcDay) * 24;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  return diff;
}

interface SessionBlock {
  name: string;
  start: number;
  end: number;
  color: string;
  opacity: number;
}

// Real market opening hours (in their local time):
// Sydney: 07:00–16:00 AEST (UTC+10/+11 DST)
// Tóquio: 09:00–18:00 JST (UTC+9, no DST)
// Londres: 08:00–17:00 BST/GMT (UTC+0/+1 DST)
// Nova Iorque: 08:00–17:00 EST/EDT (UTC-5/-4 DST)
// Converted to WAT (UTC+1):
function getSessionBlocks(): SessionBlock[] {
  const londonOffset = getTimezoneOffsetHours('Europe/London'); // 0 or 1
  const nyOffset = getTimezoneOffsetHours('America/New_York'); // -5 or -4
  const tokyoOffset = getTimezoneOffsetHours('Asia/Tokyo'); // 9
  const sydneyOffset = getTimezoneOffsetHours('Australia/Sydney'); // 10 or 11
  const wat = 1;

  // Local open/close (24h) → WAT
  const toWat = (localHour: number, localOffset: number) =>
    ((localHour - localOffset + wat) % 24 + 24) % 24;

  const sydneyStart = toWat(7, sydneyOffset);
  const sydneyEnd = toWat(16, sydneyOffset);
  const tokyoStart = toWat(9, tokyoOffset);
  const tokyoEnd = toWat(18, tokyoOffset);
  const londonStart = toWat(8, londonOffset);
  const londonEnd = toWat(17, londonOffset);
  const nyStart = toWat(8, nyOffset);
  const nyEnd = toWat(17, nyOffset);
  const overlapStart = Math.max(londonStart, nyStart);
  const overlapEnd = Math.min(londonEnd, nyEnd);

  return [
    { name: 'Sydney', start: sydneyStart, end: sydneyEnd, color: '#f59e0b', opacity: 0.20 },
    { name: 'Tóquio', start: tokyoStart, end: tokyoEnd, color: '#ef4444', opacity: 0.20 },
    { name: 'Londres', start: londonStart, end: londonEnd, color: '#0ea5e9', opacity: 0.25 },
    { name: 'Nova Iorque', start: nyStart, end: nyEnd, color: '#a855f7', opacity: 0.25 },
    { name: 'Overlap LDN/NY', start: overlapStart, end: overlapEnd, color: '#22c55e', opacity: 0.40 },
  ];
}

// Volume profile per hour in WAT, weighted by real session activity
const hourlyVolume: number[] = [
  20, 18, 15, 12, 10, 12, 18, 25, // 00-07 Sydney/Tóquio ativos
  55, 70, 75, 70, 65, 88, 98, 95, // 08-15 Londres + overlap NY (pico 13-15h WAT)
  85, 70, 50, 35, 28, 22, 18, 15, // 16-23 NY fecha, mercado esfria
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
    const sessionBlocks = getSessionBlocks();
    sessionBlocks.forEach((session) => {
      const series = chart.addSeries(HistogramSeries, {
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

    // Current hour marker - use a histogram bar with distinct color
    const currentHour = Math.floor(getWATHour());
    const markerSeries = chart.addSeries(HistogramSeries, {
      color: 'hsl(185, 100%, 50%)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    markerSeries.setData([
      { time: currentHour as any, value: 100, color: 'rgba(0, 230, 230, 0.4)' },
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
          {getSessionBlocks().map((s) => (
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
