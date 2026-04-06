
CREATE TABLE public.trade_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('win', 'loss')),
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to trade_reviews"
  ON public.trade_reviews
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
