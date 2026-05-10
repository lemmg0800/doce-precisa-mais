# Por que aparece "Not Found" e como resolver

## Entendendo: as páginas JÁ são independentes no código

Cada rota (`/auth`, `/sucesso`, `/produtos`, etc.) existe como arquivo próprio em `src/routes/` e está registrada no roteador. O problema **não é** falta de conexão entre páginas — quando você navega pelo menu (a partir do `/`), funciona perfeitamente porque o React/TanStack Router resolve a rota no navegador.

O problema acontece **só quando o navegador pede a URL diretamente ao servidor** (F5, link do Stripe, link colado). Esse é um comportamento clássico de SPA (Single Page Application):

- O app é um único `index.html` + JavaScript.
- O servidor precisa entregar esse mesmo `index.html` para qualquer URL, deixando o JS decidir qual tela mostrar.
- Se o servidor não fizer isso, ele responde 404 nativo (foi o que aconteceu — confirmei agora: `GET /auth` na Cloudflare devolve `Not Found` em texto puro, sem nem chegar no React).

Já adicionei `wrangler.jsonc` com `single-page-application` e `public/_redirects` com `/* /index.html 200`. Mesmo assim a hospedagem continua devolvendo 404, então o deploy publicado **ainda não está usando essas configurações novas**.

## O que vou fazer

### 1. Forçar o redeploy com as novas regras (passo principal)

A causa mais provável é que o build publicado é antigo — anterior ao `_redirects`. O fluxo:

- Confirmar que `public/_redirects` está sendo copiado para `dist/_redirects` no build (Vite faz isso por padrão para tudo em `public/`).
- Pedir para você clicar em **Publish → Update** novamente (não basta o Update anterior — o `_redirects` foi adicionado depois).
- Depois testar com `curl` direto: `GET /auth` precisa devolver `text/html` (o HTML do app), não `Not Found` em texto puro.

### 2. Se o redeploy ainda falhar, plano B: pré-renderizar cada rota como HTML próprio

Se a hospedagem Lovable estiver ignorando tanto o `wrangler.jsonc` quanto o `_redirects` (já vi indícios disso), podemos transformar cada rota em um arquivo HTML real durante o build. Assim:

- `dist/auth/index.html`, `dist/sucesso/index.html`, `dist/produtos/index.html`, etc.
- Cada um carrega o mesmo bundle JS, mas existe fisicamente como arquivo — qualquer hospedagem estática serve sem 404.
- F5, link do Stripe e link compartilhado funcionam sem depender de regra de fallback.

Implementação: adicionar um script pós-build que, para cada rota declarada, copia `dist/index.html` para `dist/<rota>/index.html`. Sem mudar nada no app — apenas garante que o servidor sempre encontra um arquivo.

### 3. Validar

Após a correção que funcionar:

- `curl -I https://preciflow.lovable.app/auth` → `200` com `content-type: text/html`
- F5 em `/produtos` e `/configuracoes` → carrega normalmente
- Voltar do Stripe para `/sucesso?session_id=...` → mostra a tela de confirmação

## Arquivos afetados

- Nenhuma mudança no código do app.
- Possivelmente um pequeno script de pós-build (`scripts/prerender.mjs`) e um ajuste no `package.json` se precisarmos do plano B.

## Resumo em uma frase

As páginas já são independentes — o problema é só a hospedagem não entregar o `index.html` quando você acessa direto uma rota. Primeiro tentamos corrigir via redeploy; se não resolver, geramos um HTML físico para cada rota.
