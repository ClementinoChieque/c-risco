
CREATE TABLE public.trade_setups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_setups TO authenticated;
GRANT ALL ON public.trade_setups TO service_role;

ALTER TABLE public.trade_setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own setups" ON public.trade_setups
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own setups" ON public.trade_setups
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own setups" ON public.trade_setups
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own setups" ON public.trade_setups
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trade_setups_updated_at
  BEFORE UPDATE ON public.trade_setups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.trade_analyses ADD COLUMN setup_id UUID REFERENCES public.trade_setups(id) ON DELETE SET NULL;
CREATE INDEX idx_trade_analyses_setup_id ON public.trade_analyses(setup_id);
