-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can create their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can view their own risk settings" ON public.risk_settings;
DROP POLICY IF EXISTS "Users can create their own risk settings" ON public.risk_settings;
DROP POLICY IF EXISTS "Users can update their own risk settings" ON public.risk_settings;

-- Create public access policies for single user
CREATE POLICY "Allow all access to trades" ON public.trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to risk_settings" ON public.risk_settings FOR ALL USING (true) WITH CHECK (true);