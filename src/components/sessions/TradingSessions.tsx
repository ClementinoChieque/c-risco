import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Bell, Sun, Moon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SessionsChart } from './SessionsChart';

interface SessionInfo {
  name: string;
  startHour: number;
  endHour: number;
  icon: React.ElementType;
  pairs: string[];
  description: string;
  dst?: boolean;
}

/**
 * Returns the UTC offset in hours for a given IANA timezone right now.
 * e.g. "Europe/London" → 0 in winter, 1 in summer.
 */
function getTimezoneOffsetHours(tz: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const localHour = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const localDay = Number(parts.find(p => p.type === 'day')?.value ?? 0);

  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    hour12: false,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const utcParts = utcFormatter.formatToParts(now);
  const utcHour = Number(utcParts.find(p => p.type === 'hour')?.value ?? 0);
  const utcDay = Number(utcParts.find(p => p.type === 'day')?.value ?? 0);

  let diff = localHour - utcHour + (localDay - utcDay) * 24;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  return diff;
}

function isDST(tz: string, standardOffset: number): boolean {
  return getTimezoneOffsetHours(tz) !== standardOffset;
}

function getSessions(): SessionInfo[] {
  // WAT = UTC+1 (never changes)
  // London local session: 08:00-17:00 local time
  //   Winter (GMT, UTC+0): WAT = local + 1 → 09:00-18:00 WAT ... but traditional forex = 08-17 WAT
  //   We define base hours in WAT for winter, then shift -1h when DST is active
  // NY local session: 08:00-17:00 local time
  //   Winter (EST, UTC-5): in WAT = local + 6 → 14:00-23:00 ... traditional = 13-22 WAT
  //   Same: shift -1h when DST active

  const londonDST = isDST('Europe/London', 0);
  const nyDST = isDST('America/New_York', -5);

  return [
    {
      name: 'Tóquio / Ásia',
      startHour: 1,
      endHour: 9,
      icon: Moon,
      pairs: ['USD/JPY', 'AUD/USD', 'NZD/USD'],
      description: 'Sessão mais calma, bom para ranges.',
    },
    {
      name: 'Londres / Europa',
      startHour: londonDST ? 8 : 9,
      endHour: londonDST ? 17 : 18,
      icon: Sun,
      pairs: ['EUR/USD', 'GBP/USD', 'XAU/USD'],
      description: londonDST
        ? 'Alta liquidez e volatilidade. (Horário de verão ativo)'
        : 'Alta liquidez e volatilidade.',
      dst: londonDST,
    },
    {
      name: 'Nova Iorque / América',
      startHour: nyDST ? 13 : 14,
      endHour: nyDST ? 22 : 23,
      icon: Activity,
      pairs: ['NAS100', 'US30', 'USD/CAD'],
      description: nyDST
        ? 'Overlap com Londres gera volume máximo. (Horário de verão ativo)'
        : 'Overlap com Londres gera volume máximo.',
      dst: nyDST,
    },
  ];
}

interface ScheduledAlert {
  hour: number;
  minute: number;
  message: string;
  type: 'info' | 'warning' | 'critical';
}

const scheduledAlerts: ScheduledAlert[] = [
  { hour: 8, minute: 0, message: 'Abertura de Londres: Liquidez no EUR/USD subindo.', type: 'info' },
  { hour: 13, minute: 0, message: 'Início do Overlap: Ouro e Prata entram em zona de volume.', type: 'info' },
  { hour: 14, minute: 30, message: 'CRITICAL: Abertura do NAS100. Cuidado com o ruído inicial!', type: 'critical' },
  { hour: 17, minute: 0, message: 'Londres fecha. Volume do Euro pode cair.', type: 'warning' },
];

function getWATTime(): Date {
  // WAT = UTC+1
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-AO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getDayName(date: Date): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[date.getDay()];
}

export function TradingSessions() {
  const [watTime, setWatTime] = useState(getWATTime);
  const [firedAlerts, setFiredAlerts] = useState<Set<string>>(new Set());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setWatTime(getWATTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check alerts every minute
  useEffect(() => {
    const checkAlerts = () => {
      const now = getWATTime();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const dayOfWeek = now.getDay();

      // Session alerts
      scheduledAlerts.forEach((alert) => {
        const alertKey = `${alert.hour}:${alert.minute}`;
        if (currentHour === alert.hour && currentMinute === alert.minute && !firedAlerts.has(alertKey)) {
          if (alert.type === 'critical') {
            toast.error(alert.message, { duration: 10000 });
          } else if (alert.type === 'warning') {
            toast.warning(alert.message, { duration: 8000 });
          } else {
            toast.info(alert.message, { duration: 6000 });
          }
          setFiredAlerts((prev) => new Set(prev).add(alertKey));
        }
      });

      // Friday after 17:00 warning
      if (dayOfWeek === 5 && currentHour >= 17) {
        const fridayKey = 'friday-warning';
        if (!firedAlerts.has(fridayKey)) {
          toast.warning('Fim de semana próximo. Evite novas posições (Swing risk).', { duration: 15000 });
          setFiredAlerts((prev) => new Set(prev).add(fridayKey));
        }
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [firedAlerts]);

  // Reset fired alerts at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = getWATTime();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setFiredAlerts(new Set());
      }
    };
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = watTime.getHours();
  const currentMinute = watTime.getMinutes();
  const dayOfWeek = watTime.getDay();
  const isFridayEvening = dayOfWeek === 5 && currentHour >= 17;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const sessions = useMemo(() => getSessions(), []);

  const activeSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.startHour < s.endHour) {
        return currentHour >= s.startHour && currentHour < s.endHour;
      }
      return currentHour >= s.startHour || currentHour < s.endHour;
    });
  }, [currentHour, sessions]);

  const nextAlert = useMemo(() => {
    const nowMinutes = currentHour * 60 + currentMinute;
    let closest: ScheduledAlert | null = null;
    let closestDiff = Infinity;

    for (const alert of scheduledAlerts) {
      const alertMinutes = alert.hour * 60 + alert.minute;
      let diff = alertMinutes - nowMinutes;
      if (diff < 0) diff += 1440;
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = alert;
      }
    }
    return closest
      ? { ...closest, minutesUntil: closestDiff }
      : null;
  }, [currentHour, currentMinute]);

  return (
    <div className="space-y-6">
      {/* Clock Header */}
      <div className="glass-card rounded-xl p-4 md:p-6 text-center animate-fade-in">
        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Horário de Angola (WAT)
        </p>
        <p className="font-mono text-3xl md:text-4xl font-bold text-primary tracking-wider">
          {formatTime(watTime)}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {getDayName(watTime)}
        </p>
      </div>

      {/* Weekend / Friday Warning */}
      {(isWeekend || isFridayEvening) && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm text-warning">
            {isWeekend
              ? 'Mercado fechado. Sem negociações no fim de semana.'
              : 'Fim de semana próximo. Evite novas posições (Swing risk).'}
          </p>
        </div>
      )}

      {/* Next Alert */}
      {nextAlert && (
        <div className="glass-card rounded-xl p-3 md:p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-1.5 md:mb-2">
            <Bell className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Próximo Alerta</p>
          </div>
          <p className="text-xs md:text-sm font-medium leading-snug">{nextAlert.message}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            em {Math.floor(nextAlert.minutesUntil / 60)}h {nextAlert.minutesUntil % 60}min
            {' — '}
            {String(nextAlert.hour).padStart(2, '0')}:{String(nextAlert.minute).padStart(2, '0')} WAT
          </p>
        </div>
      )}

      {/* Sessions Chart */}
      <SessionsChart />

      {/* Sessions Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Sessões de Mercado
        </h3>
        {sessions.map((session) => {
          const isActive = activeSessions.includes(session);
          const Icon = session.icon;
          return (
            <div
              key={session.name}
              className={cn(
                'glass-card rounded-xl p-3 md:p-4 transition-all duration-300 animate-fade-in',
                isActive && 'ring-1 ring-primary/40 bg-primary/5'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div
                    className={cn(
                      'p-1.5 md:p-2 rounded-lg shrink-0',
                      isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                      <p className="font-medium text-xs md:text-sm">{session.name}</p>
                      {isWeekend ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          Fechado
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Ativa
                        </span>
                      ) : null}
                      {session.dst && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-accent-foreground bg-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sun className="h-3 w-3" />
                          DST
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-snug">{session.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[10px] md:text-xs text-muted-foreground">
                    {String(session.startHour).padStart(2, '0')}:00 – {String(session.endHour).padStart(2, '0')}:00
                  </p>
                  {!isActive && (() => {
                    const now = watTime;
                    const nowMin = currentHour * 60 + currentMinute;
                    const startMin = session.startHour * 60;

                    if (isWeekend) {
                      // Calculate hours until Monday 00:00 + session start
                      const dow = now.getDay(); // 0=Sun, 6=Sat
                      let daysUntilMonday = dow === 6 ? 2 : 1; // Sat→2, Sun→1
                      const minutesUntilMidnight = 1440 - nowMin;
                      const totalMin = minutesUntilMidnight + (daysUntilMonday - 1) * 1440 + startMin;
                      const h = Math.floor(totalMin / 60);
                      const m = totalMin % 60;
                      return (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          abre Seg em {h}h {m}min
                        </p>
                      );
                    }

                    let diff = startMin - nowMin;
                    if (diff <= 0) diff += 1440;
                    const h = Math.floor(diff / 60);
                    const m = diff % 60;
                    return (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        abre em {h}h {m}min
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 flex-wrap">
                {session.pairs.map((pair) => (
                  <span
                    key={pair}
                    className="text-[10px] md:text-[11px] font-mono bg-secondary/60 text-muted-foreground px-1.5 md:px-2 py-0.5 md:py-1 rounded-md"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduled Alerts List */}
      <div className="space-y-2 md:space-y-3">
        <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Alertas Programados (WAT)
        </h3>
        <div className="glass-card rounded-xl divide-y divide-border/40">
          {scheduledAlerts.map((alert, i) => {
            const alertMinutes = alert.hour * 60 + alert.minute;
            const nowMinutes = currentHour * 60 + currentMinute;
            const isPast = alertMinutes <= nowMinutes;

            return (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 md:gap-3 p-2.5 md:p-3 transition-opacity',
                  isPast && 'opacity-40'
                )}
              >
                <Clock
                  className={cn(
                    'h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 mt-0.5',
                    alert.type === 'critical'
                      ? 'text-destructive'
                      : alert.type === 'warning'
                      ? 'text-warning'
                      : 'text-primary'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm leading-snug">{alert.message}</p>
                </div>
                <span className="font-mono text-[10px] md:text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {String(alert.hour).padStart(2, '0')}:{String(alert.minute).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
