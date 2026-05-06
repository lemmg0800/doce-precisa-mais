CREATE OR REPLACE FUNCTION public.handle_new_user_assinatura()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.assinaturas (user_id, status, trial_ends_at)
  VALUES (NEW.id, 'trial', now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Garantir que o trigger exista (caso ainda não tenha sido criado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_assinatura'
  ) THEN
    CREATE TRIGGER on_auth_user_created_assinatura
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_assinatura();
  END IF;
END$$;

-- Garantir unicidade por usuário
CREATE UNIQUE INDEX IF NOT EXISTS assinaturas_user_id_unique ON public.assinaturas(user_id);

-- Backfill: para usuários existentes sem assinatura, criar trial de 7 dias
INSERT INTO public.assinaturas (user_id, status, trial_ends_at)
SELECT u.id, 'trial', now() + interval '7 days'
FROM auth.users u
LEFT JOIN public.assinaturas a ON a.user_id = u.id
WHERE a.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;