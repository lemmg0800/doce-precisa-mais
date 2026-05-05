CREATE TABLE public.assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plano TEXT,
  status TEXT NOT NULL DEFAULT 'trial',
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assin_select_own" ON public.assinaturas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "assin_insert_own" ON public.assinaturas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assin_update_own" ON public.assinaturas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "assin_delete_own" ON public.assinaturas
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_assinaturas_user_id ON public.assinaturas(user_id);
CREATE INDEX idx_assinaturas_stripe_customer ON public.assinaturas(stripe_customer_id);

CREATE TRIGGER trg_assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Cria assinatura em trial automaticamente para novos usuários (14 dias)
CREATE OR REPLACE FUNCTION public.handle_new_user_assinatura()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.assinaturas (user_id, status, trial_ends_at)
  VALUES (NEW.id, 'trial', now() + interval '14 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_assinatura() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_assinatura
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_assinatura();

-- Backfill para usuários existentes
INSERT INTO public.assinaturas (user_id, status, trial_ends_at)
SELECT id, 'trial', now() + interval '14 days'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;