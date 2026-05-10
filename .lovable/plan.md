## Diagnóstico

Confirmei o problema testando o site publicado:

- `GET https://alquimista-precifica.lovable.app/produtos` → **HTTP 404** (resposta `Not Found` em texto puro, vinda do Cloudflare, antes de o app sequer carregar).
- `GET https://alquimista-precifica.lovable.app/materias-primas` → **HTTP 404**.
- `GET https://alquimista-precifica.lovable.app/configuracoes` → **HTTP 404**.
- `GET https://alquimista-precifica.lovable.app/` → 200 com o HTML do app.

Ou seja: o erro **não é** do TanStack Router nem das rotas do app (todas existem corretamente em `src/routes/`). O problema é que o servidor de hospedagem não está entregando `index.html` para URLs que não correspondem a um arquivo estático.

## Por que o `public/_redirects` não funcionou

O projeto é publicado como um **Cloudflare Worker** (`wrangler.jsonc` presente, com `main: "@tanstack/react-start/server-entry"`), e não como Cloudflare Pages. O arquivo `public/_redirects` é uma convenção do **Cloudflare Pages** — em Workers com Static Assets ele é simplesmente ignorado, por isso o F5 continua caindo em 404 mesmo após o último update.

Além disso, o `wrangler.jsonc` aponta `main` para `@tanstack/react-start/server-entry`, mas o `package.json` do projeto **não** tem `@tanstack/react-start` instalado — só `@tanstack/react-router`. O app roda como SPA puro (bootstrap em `src/main.tsx` com `RouterProvider`), e o Worker provavelmente está só servindo os assets estáticos sem fallback configurado para SPA.

## Correção

Configurar o fallback SPA diretamente no `wrangler.jsonc` usando o recurso nativo de Static Assets do Workers, que é o modo correto para esta stack:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

Pontos:
- `not_found_handling: "single-page-application"` faz o Cloudflare devolver `index.html` (com status 200) para qualquer rota que não case com um arquivo estático — exatamente o comportamento que `_redirects` tentava replicar.
- Removo o `main` apontando para `@tanstack/react-start/server-entry` (pacote não instalado, sem efeito útil hoje) para o Worker servir puramente assets estáticos, que é o que esta SPA precisa.
- O `directory` precisa bater com o output do Vite (`dist` por padrão); confirmo no momento da implementação se há override no projeto.
- Removo o `public/_redirects` que ficou inerte, para não confundir manutenção futura.

## Como vou validar

1. Após o publish, refazer:
   - `curl -I https://alquimista-precifica.lovable.app/produtos`
   - `curl -I https://alquimista-precifica.lovable.app/materias-primas`
   - `curl -I https://alquimista-precifica.lovable.app/configuracoes`
   
   Esperado: **HTTP 200** com `content-type: text/html` em todas.

2. Abrir cada rota no navegador e dar F5: deve renderizar a página normalmente, sem tela preta nem "Not Found".

## Observação importante

A mudança em `wrangler.jsonc` é uma **alteração de configuração de deploy**, então só passa a valer após você clicar em **Publish → Update** novamente. No preview do editor o F5 já funciona porque o sandbox usa o Vite dev server (que tem fallback SPA embutido) — o problema é exclusivo do site publicado.
