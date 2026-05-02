-- Enum para modo de custo fixo
DO $$ BEGIN
  CREATE TYPE public.modo_custo_fixo AS ENUM ('manual', 'automatico');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Adicionar campos em configuracoes
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS modo_custo_fixo public.modo_custo_fixo NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS producao_mensal_estimada numeric NOT NULL DEFAULT 0;

-- Tabela de gastos mensais
CREATE TABLE IF NOT EXISTS public.gastos_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_gasto text NOT NULL,
  valor_mensal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gastos_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gastos_select_own" ON public.gastos_mensais
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gastos_insert_own" ON public.gastos_mensais
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gastos_update_own" ON public.gastos_mensais
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gastos_delete_own" ON public.gastos_mensais
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_gastos_mensais_updated_at
  BEFORE UPDATE ON public.gastos_mensais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();