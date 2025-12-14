-- Remove foreign key constraints that reference users table
ALTER TABLE public.risk_settings DROP CONSTRAINT IF EXISTS risk_settings_user_id_fkey;
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;