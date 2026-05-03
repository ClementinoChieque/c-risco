CREATE TABLE public.execution_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market TEXT NOT NULL DEFAULT 'forex',
  text TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.execution_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own execution_checklist" ON public.execution_checklist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own execution_checklist" ON public.execution_checklist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own execution_checklist" ON public.execution_checklist
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own execution_checklist" ON public.execution_checklist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_execution_checklist_updated_at
BEFORE UPDATE ON public.execution_checklist
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();