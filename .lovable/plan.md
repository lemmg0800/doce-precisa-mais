## Formulário de contato

### Onde
Novo card **"Fale conosco"** dentro de `src/routes/configuracoes.tsx`, abaixo de "Alterar senha".

### Campos
- **Assunto** (Select obrigatório): Sugestão, Reclamação, Problema técnico, Dúvida, Outro
- **Mensagem** (Textarea obrigatória, 10–2000 chars)
- E-mail do remetente: pego automaticamente da sessão (`supabase.auth.getUser().email`) — exibido como texto não editável ("Enviando como: seu@email.com")
- Botão **Enviar**

### Comportamento
- Validação com zod (assunto enum + mensagem trim 10–2000)
- Ao enviar com sucesso: badge verde "✓ Mensagem enviada com sucesso!" aparece dentro do card e some após **4 segundos**; formulário é limpo
- Em erro: toast vermelho com a mensagem
- Botão fica em estado "Enviando..." durante a requisição

### Backend

**1. Tabela `mensagens_contato`** (via migration, com RLS):
- `user_id`, `email_remetente`, `assunto`, `mensagem`, `enviada_em`
- RLS: usuário autenticado só pode INSERT linhas com seu próprio `user_id`; SELECT/UPDATE/DELETE bloqueados (apenas admin via service role lê)

**2. Server route** `src/routes/api/contato.ts` (POST):
- Middleware `requireSupabaseAuth` (só logados podem enviar)
- Valida payload com zod
- Insere na tabela `mensagens_contato`
- Envia e-mail para **soludigi.alquimista@gmail.com** com:
  - Assunto: `[Preciflow] {assunto} — {email_remetente}`
  - Reply-To: e-mail do usuário (você responde direto pelo Gmail)
  - Corpo: assunto + mensagem + e-mail/ID do usuário

**3. Envio de e-mail — Lovable Emails**
Usa a infraestrutura nativa de e-mails do Lovable Cloud. Pré-requisito: domínio de e-mail verificado. Na implementação eu verifico o status do domínio:
- Se já houver domínio configurado → uso direto
- Se não houver → mostro o setup de domínio antes (você delega um subdomínio tipo `notify.preciflow.app` aos nameservers do Lovable). Depois disso o envio funciona automaticamente.

Não há e-mail de confirmação automático para o usuário (você pediu confirmação visual na tela apenas).

### Arquivos tocados
- `supabase/migrations/...` — nova tabela + RLS
- `src/routes/api/contato.ts` — endpoint novo
- `src/routes/configuracoes.tsx` — novo card "Fale conosco"
- (eventual) setup de domínio de e-mail via diálogo

### Fora do escopo
- Sem nova rota/menu (fica tudo em Ajustes)
- Sem painel para visualizar mensagens dentro do app (você lê pelo Gmail)
- Sem anexos