CREATE TABLE public.mensagens_contato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_remetente text NOT NULL,
  assunto text NOT NULL CHECK (assunto IN ('sugestao','reclamacao','problema_tecnico','duvida','outro')),
  mensagem text NOT NULL CHECK (char_length(mensagem) BETWEEN 10 AND 2000),
  enviada_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens_contato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_insert_own" ON public.mensagens_contato
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_mensagens_contato_enviada_em ON public.mensagens_contato (enviada_em DESC);