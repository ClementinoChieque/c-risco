import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, HistogramSeries } from 'lightweight-charts';

function getWATHour(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wat = new Date(utc + 3600000);
  return wat.getHours() + wat.getMinutes() / 60;
}

function getWATDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000);
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

function getSessionBlocks(): SessionBlock[] {
  const londonOffset = getTimezoneOffsetHours('Europe/London');
  const nyOffset = getTimezoneOffsetHours('America/New_York');
  const tokyoOffset = getTimezoneOffsetHours('Asia/Tokyo');
  const sydneyOffset = getTimezoneOffsetHours('Australia/Sydney');
  const wat = 1;

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

const fmtHour = (h: number) => `${String(Math.round(h)).padStart(2, '0')}:00`;

const hourlyVolume: number[] = [
  20, 18, 15, 12, 10, 12, 18, 25,
  55, 70, 75, 70, 65, 88, 98, 95,
  85, 70, 50, 35, 28, 22, 18, 15,
];

interface TooltipState {
  x: number;
  y: number;
  hour: number;
  visible: boolean;
}

export function SessionsChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, hour: 0, visible: false });

  const sessions = getSessionBlocks();
  const watNow = getWATDate();
  const dateLabel = watNow.toLocaleDateString('pt-AO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    if (!containerRef.current) return;

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
      rightPriceScale: { visible: true, borderColor: 'rgba(255,255,255,0.08)' },
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

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || !containerRef.current) {
        setTooltip((t) => ({ ...t, visible: false }));
        return;
      }
      setTooltip({
        x: param.point.x,
        y: param.point.y,
        hour: Number(param.time),
        visible: true,
      });
    });

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

  const hoverSessions = tooltip.visible
    ? sessions.filter((s) => {
        const h = tooltip.hour;
        return s.start < s.end ? h >= s.start && h < s.end : h >= s.start || h < s.end;
      })
    : [];

  return (
    <div className="glass-card rounded-xl p-4 animate-fade-in space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Mapa de Sessões (WAT)
        </h3>
      </div>

      {/* Legend with WAT open/close times */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {sessions.map((s) => (
          <div
            key={s.name}
            className="flex flex-col gap-1 p-2 rounded-lg bg-secondary/30 border border-border/40"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[11px] font-medium truncate">{s.name}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {fmtHour(s.start)} – {fmtHour(s.end)}
            </span>
          </div>
        ))}
      </div>

      <div ref={wrapperRef} className="relative w-full">
        <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />

        {tooltip.visible && (
          <div
            className="pointer-events-none absolute z-10 glass-card rounded-lg p-2.5 shadow-lg border border-border/60 min-w-[180px]"
            style={{
              left: Math.min(tooltip.x + 12, (wrapperRef.current?.clientWidth ?? 0) - 200),
              top: Math.max(tooltip.y - 10, 0),
            }}
          >
            <p className="text-[10px] text-muted-foreground capitalize">{dateLabel}</p>
            <p className="font-mono text-sm font-bold text-primary mt-0.5">
              {fmtHour(tooltip.hour)} WAT
            </p>
            {hoverSessions.length > 0 ? (
              <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-0.5">
                {hoverSessions.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-[10px]">{s.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground ml-auto">
                      {fmtHour(s.start)}–{fmtHour(s.end)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40">
                Nenhuma sessão ativa
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
