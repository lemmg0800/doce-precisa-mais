
# Plano: Contato e Suporte (Configurações)

## Visão geral
Adicionar um card "Contato e Suporte" na página `/configuracoes` com formulário (assunto + mensagem). O e-mail do remetente é preenchido automaticamente a partir do usuário autenticado e fica somente leitura. O envio acontece via uma server function que usa o conector Resend (sem necessidade de domínio próprio agora — usa o remetente padrão `onboarding@resend.dev`).

## Mudanças no frontend
**`src/routes/configuracoes.tsx`** — novo card antes do "Alterar senha":
- Campo "Seu e-mail": `Input` desabilitado preenchido com `user.email` (via `useAuth`/`supabase.auth.getUser`).
- Campo "Assunto": `Select` com opções:
  - Sugestão, Reclamação, Problema técnico, Dúvida, Erro no sistema, Cobrança/Assinatura, Outro
- Campo "Mensagem": `Textarea` (mín. 10, máx. 2000 caracteres).
- Botão "Enviar mensagem" com estado de loading.
- Validação client-side com zod (assunto obrigatório, mensagem 10–2000 chars, não-vazia após trim).
- Ao sucesso: `toast.success("Mensagem enviada com sucesso. Retornaremos em breve.")` que some em 5s, e limpa os campos.
- Ao erro: `toast.error` com mensagem amigável.

## Mudanças no backend
**Nova server function `src/lib/support.functions.ts`**:
- `createServerFn({ method: "POST" })` com `inputValidator` zod (`assunto`, `mensagem`).
- Lê o usuário autenticado a partir do header `Authorization` (Supabase JWT) usando o helper existente do projeto, para garantir que o e-mail do remetente venha do servidor (não confiar no cliente).
- Monta payload e envia via Resend gateway:
  - `POST https://connector-gateway.lovable.dev/resend/emails`
  - Headers: `Authorization: Bearer ${LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${RESEND_API_KEY}`
  - `from: "Preciflow Suporte <onboarding@resend.dev>"`
  - `to: ["soludigi.alquimista@gmail.com"]`
  - `reply_to: <email do usuário>`
  - `subject: "[Preciflow] <assunto> — <email do usuário>"`
  - `html`: tabela simples com e-mail do usuário, assunto, mensagem (HTML-escaped), data/hora (ISO + horário Brasil).
- Rate limit simples em memória (1 envio a cada 30s por user_id) para evitar spam.
- Retorna `{ ok: true }` ou erro tipado.

## Conector e segredos
- Conectar Resend via `standard_connectors--connect` (connector_id: `resend`). Após linkado, `RESEND_API_KEY` e `LOVABLE_API_KEY` ficam disponíveis automaticamente no servidor.
- Sem necessidade de configurar domínio — `onboarding@resend.dev` funciona imediatamente para testes/uso inicial.

## Segurança
- Chave nunca exposta no frontend (usada só na server function).
- E-mail remetente derivado do JWT no servidor, não do body.
- Validação zod no servidor (mesmo schema do cliente).
- Rate limit por usuário.
- Escape de HTML no corpo do e-mail.

## Arquivos
- Editar: `src/routes/configuracoes.tsx`
- Criar: `src/lib/support.functions.ts`
- Conectar: Resend (via tool)
