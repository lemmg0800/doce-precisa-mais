## Causa raiz confirmada

Logs do ambiente publicado (timestamp 21:44Z, após o último deploy):

```
[error] Error: No such module "h3-v2". imported from "server.js"
  at async serveSSR (index.js:15523:22)
GET https://alquimista-precifica.lovable.app/ → 502
```

O `src/server.ts` atual faz `import handler from "@tanstack/react-start/server-entry"` de forma **estática**. Quando o Cloudflare Worker bundla esse arquivo, o handler interno do TanStack acaba referenciando o módulo virtual `h3-v2` em runtime — que não existe no Worker. Resultado: o módulo falha em **import-time**, antes do `fetch` ser chamado, e nenhum try/catch ajuda. Toda requisição retorna 502.

Esse é exatamente o cenário documentado no guia oficial "TanStack Start SSR error handling": o wrapper precisa usar **import dinâmico (lazy)** + **try/catch** + **normalização de Response** + **captura global de erros**, e o `vite.config.ts` precisa apontar `tanstackStart.server.entry` para esse wrapper (já está OK).

## Correções

### 1. Reescrever `src/server.ts` com lazy import e tratamento completo

```ts
import "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { consumeLastCapturedError } from "./lib/error-capture";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry")
      .then((m) => (m.default ?? m) as ServerEntry);
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
```

### 2. Criar `src/lib/error-capture.ts`

Listeners globais de `error` e `unhandledrejection` que armazenam o último erro por 5s, para correlacionar quando o h3 engole a exceção.

### 3. Criar `src/lib/error-page.ts`

HTML autocontido (sem imports do app) com mensagem amigável e botões "Tentar novamente" / "Ir para início".

### 4. Verificações

- Confirmar que `vite.config.ts` continua com `tanstackStart.server.entry: "server"` (já está).
- Confirmar que `wrangler.jsonc` aponta `main: "src/server.ts"` (já está).
- Após o deploy, chamar `/` via invoke-server-function e checar logs publicados — esperado: HTTP 200, sem erro `h3-v2`.

## Após implementar

Você precisa clicar em **Update** no menu **Publish** para publicar a nova versão. Depois disso eu valido com os logs reais que o 502 desapareceu.
