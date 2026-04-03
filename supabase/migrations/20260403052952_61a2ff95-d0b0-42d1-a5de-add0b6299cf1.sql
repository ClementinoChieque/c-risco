ALTER TABLE public.trade_analyses ADD COLUMN market text NOT NULL DEFAULT 'forex';
ALTER TABLE public.trade_analyses ADD COLUMN lot_size numeric DEFAULT 0;
ALTER TABLE public.trade_analyses ADD COLUMN risk_percentage numeric DEFAULT 0;