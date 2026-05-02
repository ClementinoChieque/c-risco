CREATE TABLE public.propfirm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  funded_balance numeric NOT NULL DEFAULT 0,
  profit_target numeric NOT NULL DEFAULT 10,
  daily_drawdown numeric NOT NULL DEFAULT 5,
  max_drawdown numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.propfirm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own propfirm_settings"
  ON public.propfirm_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own propfirm_settings"
  ON public.propfirm_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own propfirm_settings"
  ON public.propfirm_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_propfirm_settings_updated_at
  BEFORE UPDATE ON public.propfirm_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();