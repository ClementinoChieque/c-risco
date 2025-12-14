-- Add crypto account balance column
ALTER TABLE public.risk_settings 
ADD COLUMN crypto_account_balance numeric NOT NULL DEFAULT 10000;