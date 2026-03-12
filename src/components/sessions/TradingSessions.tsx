import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Bell, Sun, Moon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionInfo {
  name: string;
  startHour: number;
  endHour: number;
  icon: React.ElementType;
  pairs: string[];
  description: string;
}

const sessions: SessionInfo[] = [
  {
    name: 'Tóquio / Ásia',
    startHour: 0,
    endHour: 8,
    icon: Moon,
    pairs: ['USD/JPY', 'AUD/USD', 'NZD/USD'],
    description: 'Sessão mais calma, bom para ranges.',
  },
  {
    name: 'Londres / Europa',
    startHour: 8,
    endHour: 17,
    icon: Sun,
    pairs: ['EUR/USD', 'GBP/USD', 'XAU/USD'],
    description: 'Alta liquidez e volatilidade.',
  },
  {
    name: 'Nova Iorque / América',
    startHour: 13,
    endHour: 22,
    icon: Activity,
    pairs: ['NAS100', 'US30', 'USD/CAD'],
    description: 'Overlap com Londres gera volume máximo.',
  },
];

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

  const activeSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.startHour < s.endHour) {
        return currentHour >= s.startHour && currentHour < s.endHour;
      }
      return currentHour >= s.startHour || currentHour < s.endHour;
    });
  }, [currentHour]);

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
      <div className="glass-card rounded-xl p-6 text-center animate-fade-in">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Horário de Angola (WAT)
        </p>
        <p className="font-mono text-4xl font-bold text-primary tracking-wider">
          {formatTime(watTime)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
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
        <div className="glass-card rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Próximo Alerta</p>
          </div>
          <p className="text-sm font-medium">{nextAlert.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            em {Math.floor(nextAlert.minutesUntil / 60)}h {nextAlert.minutesUntil % 60}min
            {' — '}
            {String(nextAlert.hour).padStart(2, '0')}:{String(nextAlert.minute).padStart(2, '0')} WAT
          </p>
        </div>
      )}

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
                'glass-card rounded-xl p-4 transition-all duration-300 animate-fade-in',
                isActive && 'ring-1 ring-primary/40 bg-primary/5'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{session.name}</p>
                      {isActive && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Ativa
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{session.description}</p>
                  </div>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {String(session.startHour).padStart(2, '0')}:00 – {String(session.endHour).padStart(2, '0')}:00
                </p>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {session.pairs.map((pair) => (
                  <span
                    key={pair}
                    className="text-[11px] font-mono bg-secondary/60 text-muted-foreground px-2 py-1 rounded-md"
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
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
                  'flex items-center gap-3 p-3 transition-opacity',
                  isPast && 'opacity-40'
                )}
              >
                <Clock
                  className={cn(
                    'h-4 w-4 shrink-0',
                    alert.type === 'critical'
                      ? 'text-destructive'
                      : alert.type === 'warning'
                      ? 'text-warning'
                      : 'text-primary'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{alert.message}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
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
