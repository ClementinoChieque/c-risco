-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  take_profit NUMERIC NOT NULL,
  position_size NUMERIC NOT NULL,
  leverage NUMERIC,
  lot_size NUMERIC,
  pip_value NUMERIC,
  risk_amount NUMERIC NOT NULL,
  risk_percentage NUMERIC NOT NULL,
  potential_profit NUMERIC NOT NULL,
  risk_reward_ratio NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  result NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own trades" 
ON public.trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades" 
ON public.trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
ON public.trades 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
ON public.trades 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create risk_settings table
CREATE TABLE public.risk_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  account_balance NUMERIC NOT NULL DEFAULT 10000,
  max_risk_per_trade NUMERIC NOT NULL DEFAULT 2,
  max_daily_risk NUMERIC NOT NULL DEFAULT 6,
  max_open_trades INTEGER NOT NULL DEFAULT 5,
  max_daily_loss NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for risk_settings
ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for risk_settings
CREATE POLICY "Users can view their own risk settings" 
ON public.risk_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own risk settings" 
ON public.risk_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own risk settings" 
ON public.risk_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_risk_settings_updated_at
BEFORE UPDATE ON public.risk_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();