
CREATE TABLE public.csv_datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market TEXT NOT NULL CHECK (market IN ('forex','crypto','propfirm')),
  filename TEXT NOT NULL,
  headers JSONB NOT NULL DEFAULT '[]'::jsonb,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.csv_datasets TO authenticated;
GRANT ALL ON public.csv_datasets TO service_role;

ALTER TABLE public.csv_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own csv" ON public.csv_datasets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own csv" ON public.csv_datasets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own csv" ON public.csv_datasets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own csv" ON public.csv_datasets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_csv_datasets_updated_at
  BEFORE UPDATE ON public.csv_datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_csv_datasets_user_market ON public.csv_datasets(user_id, market, created_at DESC);
