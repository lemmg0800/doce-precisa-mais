# Relatório para Suporte Lovable — Falha no SPA fallback do hosting

## Resumo

Projeto SPA (Vite + TanStack Router, sem SSR) publicado em `https://preciflow.lovable.app`. Acesso direto a qualquer rota além de `/` retorna **HTTP 404** servido pelo Cloudflare do Lovable, mesmo com `wrangler.jsonc` declarando `not_found_handling: "single-page-application"` e `public/_redirects` com `/* /index.html 200`. Indica que o ambiente de publish não está aplicando o SPA fallback configurado.

## Evidência 1 — Resposta HTTP do domínio publicado

Coletado em 11/05/2026 20:45 UTC:

```
$ curl -sI https://preciflow.lovable.app/produtos
HTTP/2 404 
content-type: text/plain;charset=UTF-8
server: cloudflare
cf-ray: 9fa40774cc40ef54-LHR
(sem header x-deployment-id — resposta não veio do deploy do app)

$ curl -sI https://preciflow.lovable.app/
HTTP/2 200 
content-type: text/html; charset=utf-8
x-deployment-id: 82cf5dc55c8eef56673c41a41475f1d1824ebb1635b703eeb2125f8c91c79d84
```

A raiz é servida pelo deployment correto (`x-deployment-id` presente). `/produtos` retorna 404 genérico do Cloudflare sem `x-deployment-id`, indicando que o request não está caindo no handler de assets do Worker — o `not_found_handling: "single-page-application"` não está sendo respeitado.

## Evidência 2 — `wrangler.jsonc` no repositório

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

## Evidência 3 — `public/_redirects` no repositório

```
/*    /index.html   200
```

## Evidência 4 — Build local validado

`bun run build` executado com sucesso. Conteúdo de `dist/` após o build:

```
dist/
├── _headers
├── _redirects        ← copiado de public/, com /* /index.html 200
├── assets/           ← única subpasta
├── favicon.png
└── index.html
```

- `dist/_redirects` existe e contém exatamente `/*    /index.html   200`.
- `dist/_headers` existe com `Cache-Control: no-cache` em `/index.html`.
- **Não existem** as pastas `dist/produtos/`, `dist/kits/`, `dist/configuracoes/` etc. — confirmando que nenhum workaround de prerender está poluindo a saída.
- `dist/index.html` existe (servido corretamente em `/`).

## Evidência 5 — URLs de referência

- Projeto publicado: `https://preciflow.lovable.app`
- Rota com 404 (uma de várias): `https://preciflow.lovable.app/produtos`
- Outras rotas igualmente afetadas: `/kits`, `/configuracoes`, `/materias-primas`, `/receitas`, `/assinatura`, `/landing`, `/auth`
- Raiz funciona: `https://preciflow.lovable.app/` → 200

## Tentativas anteriores descartadas

1. **Plugin `prerenderStaticRoutes()` em `vite.config.ts`** — workaround que copiava `dist/index.html` para `dist/<rota>/index.html` para forçar resposta 200 nas rotas. Removido porque (a) falhava silenciosamente em `closeBundle` em builds com múltiplos environments, (b) exigia manutenção manual de `STATIC_ROUTES` para cada nova rota, (c) cria semântica conflitante com SPA fallback. Não é solução para SPA — é remendo.
2. **HashRouter / BrowserRouter (react-router-dom)** — descartado: o projeto usa TanStack Router file-based, e a documentação oficial do Lovable orienta explicitamente a não usar essas abordagens.
3. **Editar `src/routeTree.gen.ts`** — descartado por ser arquivo gerado.

## Conclusão técnica

Todas as configurações necessárias do lado do código estão corretas e validadas no build local. O comportamento esperado é: qualquer URL não correspondente a um asset físico em `dist/` deve servir `dist/index.html` com status 200, deixando o TanStack Router resolver a rota no cliente. O ambiente de hosting do Lovable está, em vez disso, retornando 404 do Cloudflare diretamente, sem invocar o SPA fallback.

Pedido ao suporte: investigar por que o deployment de `https://preciflow.lovable.app` não está aplicando `assets.not_found_handling: "single-page-application"` do `wrangler.jsonc` nem o `_redirects` presente em `dist/`.
