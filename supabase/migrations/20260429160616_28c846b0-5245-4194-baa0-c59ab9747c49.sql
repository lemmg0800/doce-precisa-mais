ALTER TABLE public.produto_itens ADD COLUMN IF NOT EXISTS unidade_utilizada public.unidade_medida;
ALTER TABLE public.kit_itens ADD COLUMN IF NOT EXISTS unidade_utilizada public.unidade_medida;