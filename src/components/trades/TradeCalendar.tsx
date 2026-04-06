import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

interface TradeDay {
  date: string;
  wins: number;
  losses: number;
  totalAmount: number;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function TradeCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tradeDays, setTradeDays] = useState<Map<string, TradeDay>>(new Map());
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchTrades();
  }, [year, month]);

  const fetchTrades = async () => {
    setLoading(true);
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('trade_analyses')
      .select('type, amount, created_at')
      .eq('user_id', SINGLE_USER_ID)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    if (!error && data) {
      const map = new Map<string, TradeDay>();
      data.forEach((t) => {
        const dateKey = new Date(t.created_at).toISOString().split('T')[0];
        const existing = map.get(dateKey) || { date: dateKey, wins: 0, losses: 0, totalAmount: 0 };
        if (t.type === 'win') {
          existing.wins += 1;
          existing.totalAmount += Math.abs(t.amount || 0);
        } else {
          existing.losses += 1;
          existing.totalAmount -= Math.abs(t.amount || 0);
        }
        map.set(dateKey, existing);
      });
      setTradeDays(map);
    }
    setLoading(false);
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <Card className="glass-card border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calendário de Trades</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-8">A carregar...</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const trade = tradeDays.get(dateKey);
                const isToday = dateKey === todayKey;

                return (
                  <div
                    key={dateKey}
                    className={`aspect-square rounded-md border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                      isToday
                        ? 'border-primary bg-primary/10'
                        : trade
                        ? trade.totalAmount >= 0
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-red-500/30 bg-red-500/10'
                        : 'border-border/30 hover:bg-accent/50'
                    }`}
                  >
                    <span className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {day}
                    </span>
                    {trade && (
                      <div className="flex items-center gap-0.5">
                        {trade.wins > 0 && (
                          <span className="flex items-center text-emerald-500">
                            <TrendingUp className="h-2.5 w-2.5" />
                            <span className="text-[10px]">{trade.wins}</span>
                          </span>
                        )}
                        {trade.losses > 0 && (
                          <span className="flex items-center text-red-500">
                            <TrendingDown className="h-2.5 w-2.5" />
                            <span className="text-[10px]">{trade.losses}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
                <span>Dia positivo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" />
                <span>Dia negativo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm border border-primary bg-primary/10" />
                <span>Hoje</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
