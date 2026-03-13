-- Create storage bucket for trade analyses
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-analyses', 'trade-analyses', true);

-- Create table to track uploaded analyses
CREATE TABLE public.trade_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('win', 'loss')),
  image_url text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to trade_analyses" ON public.trade_analyses
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Storage policies
CREATE POLICY "Allow public read trade-analyses" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'trade-analyses');

CREATE POLICY "Allow public insert trade-analyses" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'trade-analyses');

CREATE POLICY "Allow public delete trade-analyses" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'trade-analyses');