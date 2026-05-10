# Corrigir 404 nas rotas publicadas (ex.: /auth, /sucesso)

## O problema

No site publicado (`alquimista-precifica.lovable.app`):

- `/` → 200 (carrega normal)
- `/auth`, `/sucesso`, `/cancelado`, `/produtos` (ao atualizar a página ou vindo de fora, como do Stripe) → **404 "Not Found"** em texto puro

Confirmei via requisição direta: a resposta é o 404 padrão do servidor da Cloudflare, não a página 404 do app. Isso significa que o **fallback de SPA não está ativo no deploy** — qualquer URL que não seja `/` não é entregue como `index.html`, então o React/TanStack Router nem chega a rodar para tratar a rota.

O arquivo `wrangler.jsonc` no projeto já tem `"not_found_handling": "single-page-application"`, mas o deploy publicado está ignorando essa configuração. Por isso o "Update" não resolveu sozinho — não é falta de re-publicar, é a configuração de hosting que precisa ser garantida.

## O que vou fazer

1. **Forçar o fallback SPA no deploy**
   - Garantir que o build gera `dist/index.html`.
   - Adicionar um arquivo de fallback redundante (`public/_redirects` com `/* /index.html 200`) para que, mesmo que o `wrangler.jsonc` não seja respeitado pelo runtime atual, o fallback de SPA continue funcionando como rede de segurança em qualquer hospedagem estática.
   - Revisar `wrangler.jsonc` para confirmar que `assets.directory` aponta para `./dist` e o `not_found_handling` continua como `single-page-application`.

2. **Validar o roteamento do app**
   - Conferir `src/router.tsx`, `src/routes/__root.tsx` e `src/routeTree.gen.ts` para confirmar que `/auth`, `/sucesso`, `/cancelado` e demais rotas estão registradas e que `notFoundComponent` exibe a tela em português (já existe).
   - Garantir que o `AuthGate` não quebre rotas públicas quando a sessão ainda está carregando (ele já trata, mas vou revisar para evitar redirect prematuro vindo do Stripe).

3. **Verificação após o redeploy**
   - Após a publicação, testar diretamente:
     - `GET /auth` → deve devolver `text/html` (o `index.html` do app), e o React renderiza a tela de login.
     - `GET /sucesso?session_id=...` → mesmo comportamento, e a página de sucesso do Stripe carrega.
     - F5 em `/produtos`, `/configuracoes` etc. → não deve mais dar 404.
   - Confirmar que vir do Stripe para `/sucesso` mostra a página de confirmação, não o 404.

## Detalhes técnicos

- `public/_redirects` é o padrão do Netlify/Cloudflare Pages para SPA fallback. Mesmo em Workers/Pages, ter este arquivo no `dist` é o método mais portátil e funciona como rede de segurança.
- Não vou mexer em `src/routeTree.gen.ts` (auto-gerado) nem trocar TanStack Router por React Router.
- Após aplicar, é necessário clicar em **Publish → Update** mais uma vez para o novo build (com o `_redirects`) ir ao ar.

## Arquivos afetados

- `public/_redirects` (novo)
- `wrangler.jsonc` (revisão, possivelmente sem mudança)
- Possíveis pequenos ajustes em `src/routes/__root.tsx` se identificar algum redirect indevido durante carregamento.
