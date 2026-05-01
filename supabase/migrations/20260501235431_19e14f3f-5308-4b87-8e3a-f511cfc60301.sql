-- Coluna de configuração
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS habilitar_receitas boolean NOT NULL DEFAULT false;

-- Tabela receitas
CREATE TABLE IF NOT EXISTS public.receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_receita text NOT NULL,
  rendimento numeric NOT NULL DEFAULT 1,
  unidade_rendimento public.unidade_medida NOT NULL DEFAULT 'g',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rec_select_own" ON public.receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rec_insert_own" ON public.receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rec_update_own" ON public.receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rec_delete_own" ON public.receitas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_receitas_updated_at
BEFORE UPDATE ON public.receitas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tabela receita_itens
CREATE TABLE IF NOT EXISTS public.receita_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id uuid NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  materia_prima_id uuid NOT NULL REFERENCES public.materias_primas(id) ON DELETE RESTRICT,
  quantidade_utilizada numeric NOT NULL DEFAULT 0,
  unidade_utilizada public.unidade_medida NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receita_itens_receita ON public.receita_itens(receita_id);

ALTER TABLE public.receita_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rec_itens_select_own" ON public.receita_itens FOR SELECT
USING (EXISTS (SELECT 1 FROM public.receitas r WHERE r.id = receita_itens.receita_id AND r.user_id = auth.uid()));

CREATE POLICY "rec_itens_insert_own" ON public.receita_itens FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.receitas r WHERE r.id = receita_itens.receita_id AND r.user_id = auth.uid()));

CREATE POLICY "rec_itens_update_own" ON public.receita_itens FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.receitas r WHERE r.id = receita_itens.receita_id AND r.user_id = auth.uid()));

CREATE POLICY "rec_itens_delete_own" ON public.receita_itens FOR DELETE
USING (EXISTS (SELECT 1 FROM public.receitas r WHERE r.id = receita_itens.receita_id AND r.user_id = auth.uid()));

-- Tabela produto_receitas
CREATE TABLE IF NOT EXISTS public.produto_receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  receita_id uuid NOT NULL REFERENCES public.receitas(id) ON DELETE RESTRICT,
  quantidade_utilizada numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produto_receitas_produto ON public.produto_receitas(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_receitas_receita ON public.produto_receitas(receita_id);

ALTER TABLE public.produto_receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_select_own" ON public.produto_receitas FOR SELECT
USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_receitas.produto_id AND p.user_id = auth.uid()));

CREATE POLICY "pr_insert_own" ON public.produto_receitas FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_receitas.produto_id AND p.user_id = auth.uid()));

CREATE POLICY "pr_update_own" ON public.produto_receitas FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_receitas.produto_id AND p.user_id = auth.uid()));

CREATE POLICY "pr_delete_own" ON public.produto_receitas FOR DELETE
USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_receitas.produto_id AND p.user_id = auth.uid()));