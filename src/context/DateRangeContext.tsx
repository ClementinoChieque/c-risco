import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

interface DateRangeState {
  from: string; // yyyy-mm-dd
  to: string;
  source: string | null; // ex.: nome do CSV usado para definir o período
  setRange: (from: string, to: string, source?: string | null) => void;
  clear: () => void;
  inRange: (date: string | Date | null | undefined) => boolean;
  hasRange: boolean;
}

const DateRangeContext = createContext<DateRangeState | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [source, setSource] = useState<string | null>(null);

  const value = useMemo<DateRangeState>(() => {
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59.999`) : null;
    return {
      from,
      to,
      source,
      hasRange: !!(from || to),
      setRange: (f, t, s = null) => { setFrom(f); setTo(t); setSource(s); },
      clear: () => { setFrom(''); setTo(''); setSource(null); },
      inRange: (date) => {
        if (!fromDate && !toDate) return true;
        if (!date) return false;
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      },
    };
  }, [from, to, source]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider');
  return ctx;
}
