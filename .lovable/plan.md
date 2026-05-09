## Causa raiz (confirmada nos logs publicados)

Os logs do Worker em produção mostram, em todas as requisições:

```
Error: No such module "h3-v2".
  imported from "server.js"
GET https://alquimista-precifica.lovable.app/ → 502
```

Toda requisição (inclusive `/favicon.ico`) retorna 502 porque o Worker referencia um chunk (`h3-v2`) que não foi incluído no bundle.

A causa exata: numa rodada anterior eu alterei `wrangler.jsonc` para apontar `main` para `dist/server/server.js`. O valor original do template (no commit base `b781158`) era:

```
"main": "@tanstack/react-start/server-entry"
```

Esse specifier é resolvido pelo plugin `@cloudflare/vite-plugin` no momento do build do TanStack Start, gerando um bundle de Worker self-contained. Ao trocar para um caminho de arquivo (`dist/server/server.js`), o pipeline da Lovable deixou de fazer essa resolução e passou a publicar um arquivo que tenta importar dinamicamente o chunk `h3-v2` — chunk que nunca foi empacotado junto. Resultado: Worker sobe, mas todo `fetch` quebra.

`vite.config.ts` já está limpo (template padrão), e os arquivos `src/server.ts` / `error-capture` / `error-page` já foram removidos. Só falta reverter o `main` do wrangler.

## Mudança proposta (1 arquivo)

**`wrangler.jsonc`** — restaurar o valor original do template:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

Nada mais é tocado: rotas, autenticação, Stripe, importação, edge functions e RLS continuam exatamente como estão.

## Verificação após aplicar

1. Pedir para você clicar em **Update** no menu Publish.
2. Reler `stack_modern--server-function-logs` (deployment=published) e confirmar que o erro `No such module "h3-v2"` sumiu e que `GET /` responde 200.
3. Se algum erro novo aparecer, ele agora será o erro real do app (não mais o crash de bootstrap), e eu sigo o diagnóstico a partir daí.

## Por que isso resolve definitivamente

- O erro nos logs publicados é literal e único: módulo `h3-v2` ausente no bundle.
- A única coisa que mudou em relação ao template funcional foi o `main` do `wrangler.jsonc`.
- Restaurar esse campo devolve a resolução do entry ao plugin Cloudflare/TanStack, que reempacota tudo (incluindo `h3-v2`) num único módulo de Worker.
