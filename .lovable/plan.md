## Objetivo
Corrigir o problema em que páginas como `/sucesso`, `/cancelado` e outras rotas diretas mostram **Not Found** ao atualizar, abrir o link direto ou voltar da Stripe, garantindo que funcionem sem precisar partir da `/`.

## O que será feito
1. **Diagnosticar a origem do erro no ambiente publicado**
   - Confirmar por que o domínio publicado está respondendo `Not Found` em rotas válidas como `/auth` e `/sucesso`.
   - Diferenciar falha de roteamento do app vs. falha do deploy publicado.

2. **Ajustar a configuração de entrada/roteamento do app, se necessário**
   - Revisar a configuração do router e da rota raiz para garantir suporte correto a acesso direto, refresh e navegação vinda de serviços externos.
   - Corrigir qualquer comportamento que esteja tratando páginas válidas como inexistentes.

3. **Validar o fluxo público de retorno da Stripe**
   - Conferir se as páginas de retorno (`/sucesso` e `/cancelado`) continuam públicas e acessíveis mesmo sem sessão iniciada.
   - Garantir que o usuário consiga cair nessas rotas diretamente pelo redirecionamento do checkout.

4. **Verificar URLs usadas no pagamento**
   - Confirmar que os links de sucesso/cancelamento apontam para o domínio publicado correto, e não para preview, rota antiga ou URL inconsistente.

5. **Testar os cenários críticos**
   - Abrir `/auth` direto.
   - Abrir `/sucesso` direto.
   - Atualizar a página em uma rota interna.
   - Simular retorno externo para validar o fluxo completo.

## Achados atuais
- As rotas existem no código (`/sucesso`, `/cancelado`, `/auth`).
- O problema não parece ser ausência de arquivo de rota.
- No domínio publicado, `/sucesso` e `/auth` estão retornando `Not Found`, o que indica problema no app publicado ou no deploy atual, não apenas na navegação interna.

## Detalhes técnicos
- Revisar `src/router.tsx` e `src/routes/__root.tsx` em conjunto com o comportamento publicado.
- Confirmar que a navegação protegida não está interferindo em rotas públicas ao entrar direto por URL.
- Validar o comportamento final no domínio publicado após a correção.