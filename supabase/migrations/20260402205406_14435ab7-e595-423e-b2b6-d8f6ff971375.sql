ALTER TABLE public.trade_analyses 
  ADD COLUMN amount numeric DEFAULT 0,
  ADD COLUMN asset_pair text DEFAULT '',
  ADD COLUMN risk_reward numeric DEFAULT 0;