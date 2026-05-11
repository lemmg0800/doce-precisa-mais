## Diagnóstico

O projeto **não é TanStack Start (SSR)** — é uma SPA pura: `src/main.tsx` faz `createRoot().render(<RouterProvider />)`, sem entry SSR, sem server functions, sem `@tanstack/react-start`. Logo, qualquer URL acessada diretamente precisa de **fallback do servidor para `index.html`** — não de HTML "prerenderizado".

O fallback já existe em dois lugares:

1. `wrangler.jsonc` → `assets.not_found_handling: "single-page-application"` (Cloudflare Workers serve `index.html` automaticamente para qualquer rota não encontrada).
2. `public/_redirects` → `/* /index.html 200` (fallback SPA padrão de hosts estáticos).

Ou seja, o 404 em `/produtos` no domínio publicado **não é causado por falta de prerender**. O plugin `prerenderStaticRoutes()` em `vite.config.ts` é um workaround frágil que:

- Roda em `closeBundle`, mas em builds com múltiplos environments (client/SSR) o `closeBundle` dispara várias vezes e o `dist/index.html` pode ainda não existir na primeira chamada → o `try/catch` engole o erro silenciosamente e o log `[prerender] wrote X route HTML shells` simplesmente não aparece. Isso bate exatamente com o sintoma que você descreveu.
- Mesmo quando funciona, só cobre rotas listadas manualmente em `STATIC_ROUTES` — qualquer rota nova quebra de novo (já aconteceu: `landing` foi adicionada à mão).
- Cria pastas físicas (`dist/produtos/index.html`) que conflitam com a semântica SPA do Worker e podem servir HTML obsoleto após mudanças.

A causa real do 404 publicado é uma das três:

a) o build de publish está rodando `build:dev` ou outro modo que falha, e o `dist/` publicado está desatualizado;
b) o ambiente publicado não está usando `wrangler.jsonc` (publish estático sem Worker) e o `_redirects` não está sendo respeitado por algum motivo (ex.: arquivo não foi incluído no `dist/`, o que é tratado pelo Vite copiando `public/` — precisa ser confirmado pós-build);
c) o publish anterior ficou em cache antes de qualquer dessas correções.

## Objetivo

Eliminar o workaround frágil e garantir que o SPA fallback funcione de verdade no publish, para que **toda rota futura** funcione em acesso direto sem precisar editar `vite.config.ts`.

## Mudanças

### 1. `vite.config.ts` — remover o plugin de prerender
- Apagar `STATIC_ROUTES`, `prerenderStaticRoutes()` e a referência em `plugins`.
- Apagar o comentário `// touch: trigger republish`.
- Manter o restante (TanStackRouterVite, react, tailwind, tsconfigPaths) intacto.

### 2. `public/_redirects` — garantir fallback SPA correto
- Conferir que o conteúdo é exatamente `/*    /index.html   200` (com newline final). Vite copia `public/` para `dist/` automaticamente, então isso vai parar em `dist/_redirects` e cobre hosts estáticos genéricos.

### 3. `public/_headers` (novo, opcional mas recomendado)
- Adicionar headers para evitar cache agressivo do `index.html`:
  ```
  /index.html
    Cache-Control: no-cache
  ```
  Isso impede que um `index.html` antigo continue sendo servido após republish — uma causa comum de "publiquei e continua quebrado".

### 4. Validação pós-build (sem modificar código)
Após implementar, rodar `bun run build` e confirmar no `dist/`:
- `dist/index.html` existe.
- `dist/_redirects` existe com a regra SPA.
- **Não existem** mais pastas `dist/produtos/`, `dist/kits/`, etc. (confirma que o workaround sumiu).
- O tamanho do bundle JS principal está coerente.

### 5. Teste do publish
Após republicar, testar acesso direto a:
- `https://preciflow.lovable.app/produtos`
- `https://preciflow.lovable.app/kits`
- `https://preciflow.lovable.app/configuracoes`
- Uma rota inexistente como `/xyz` (deve cair no NotFoundComponent do TanStack Router, não num 404 do servidor).

Se mesmo após isso `/produtos` continuar 404, o problema está fora do código (configuração de hosting do publish ignorando `wrangler.jsonc` e `_redirects`) e o próximo passo é abrir suporte com essa evidência objetiva — não continuar batendo no `vite.config.ts`.

## Por que isso é mais robusto

- Roteamento client-side passa a funcionar para **qualquer rota** que você criar em `src/routes/`, sem manutenção de listas estáticas.
- Remove uma fonte real de falha silenciosa no build (o `try/catch` que esconde erros).
- Alinha o comportamento com a recomendação oficial do stack (SPA fallback do host), em vez de tentar simular SSR copiando `index.html` para subpastas.
