-- Tabela de categorias de produto
CREATE TABLE public.categorias_produto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_categoria TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#94a3b8',
  ordem_exibicao INTEGER NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_select_own ON public.categorias_produto FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY cat_insert_own ON public.categorias_produto FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cat_update_own ON public.categorias_produto FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY cat_delete_own ON public.categorias_produto FOR DELETE USING (auth.uid() = user_id AND is_default = false);

CREATE TRIGGER trg_categorias_updated
BEFORE UPDATE ON public.categorias_produto
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Adiciona categoria_id em produtos (set null on delete para preservar produto)
ALTER TABLE public.produtos
  ADD COLUMN categoria_id UUID REFERENCES public.categorias_produto(id) ON DELETE SET NULL;

CREATE INDEX idx_produtos_categoria_id ON public.produtos(categoria_id);
CREATE INDEX idx_categorias_user_ordem ON public.categorias_produto(user_id, ordem_exibicao);

-- Cria categoria "Sem categoria" para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_categoria()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.categorias_produto (user_id, nome_categoria, cor, ordem_exibicao, ativa, is_default)
  VALUES (NEW.id, 'Sem categoria', '#94a3b8', 0, true, true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_categoria ON auth.users;
CREATE TRIGGER on_auth_user_created_categoria
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categoria();

-- Cria categoria padrão para usuários existentes
INSERT INTO public.categorias_produto (user_id, nome_categoria, cor, ordem_exibicao, ativa, is_default)
SELECT DISTINCT user_id, 'Sem categoria', '#94a3b8', 0, true, true
FROM public.produtos
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_produto c
  WHERE c.user_id = produtos.user_id AND c.is_default = true
);