# Melhorias no fluxo de cadastro e login

## Objetivo

Tornar o fluxo de criação de conta mais claro:
1. Mostrar as regras de senha **antes** do usuário tentar criar
2. Após cadastro, mostrar tela/mensagem dizendo que um email de confirmação foi enviado
3. Se o usuário tentar fazer login sem ter confirmado o email, mostrar mensagem específica explicando o motivo (em vez do erro genérico do Supabase)

## Escopo

Tudo acontece no arquivo `src/routes/auth.tsx`. Nenhuma mudança de backend/banco/configurações de auth — o Supabase já está configurado para exigir confirmação de email (auto-confirm desativado, conforme regra do projeto).

## Mudanças

### 1. Regras de senha visíveis no modo "criar conta"

Abaixo do campo Senha, quando `mode === "signup"`, exibir uma lista das regras:
- Mínimo de 6 caracteres
- (manter alinhado ao `minLength={6}` que já existe — sem inventar regras que o backend não valida)

Estilo discreto: `text-xs text-muted-foreground` em lista com checkmarks que ficam verdes conforme o usuário digita (validação visual em tempo real).

### 2. Tela de "verifique seu email" pós-cadastro

Após `supabase.auth.signUp` ter sucesso, em vez de só mostrar um toast e voltar para "signin", trocar o conteúdo do Card por uma tela de confirmação:

- Ícone de email
- Título: "Confirme seu email"
- Texto: "Enviamos um link de confirmação para **{email}**. Clique no link para ativar sua conta antes de entrar."
- Botão "Voltar para login" que retorna ao formulário em modo signin
- Botão secundário "Reenviar email" que chama `supabase.auth.resend({ type: 'signup', email })`

Controlado por novo estado local `signupEmailSent: string | null`.

### 3. Mensagem clara no login quando email não foi confirmado

Hoje o catch genérico mostra `err.message` direto do Supabase ("Email not confirmed"). Trocar para detectar esse caso específico:

```
if (err.message.includes("Email not confirmed") || err.code === "email_not_confirmed") {
  toast.error("Você precisa confirmar seu email antes de entrar. Verifique sua caixa de entrada.", {
    action: { label: "Reenviar email", onClick: () => supabase.auth.resend(...) }
  });
}
```

Mantém os outros erros (senha errada, etc.) com a mensagem padrão.

## Arquivos afetados

- `src/routes/auth.tsx` — única edição

## Fora de escopo

- Não alterar configurações de auth do Supabase (auto-confirm continua desativado)
- Não criar página `/reset-password` (não foi pedido)
- Não mexer em templates de email (continuam os padrão da Lovable Cloud)
