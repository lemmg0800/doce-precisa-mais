# Relatório para Suporte Lovable — SPA fallback quebrado em todo o deployment

## Resumo

Projeto SPA (Vite + TanStack Router, sem SSR) publicado em `https://preciflow.lovable.app`.

**Toda e qualquer URL diferente de `/` retorna HTTP 404 do Cloudflare neste deployment.** O problema **não** é específico de uma rota — afeta 100% das URLs filhas, incluindo:
- rotas que existem em `src/routes/` (deveriam ser servidas pelo SPA fallback e resolvidas no cliente),
- rotas inexistentes (que também deveriam cair no fallback servindo `index.html` com 200, e só então o roteador cliente decidiria mostrar 404).

O 404 vem direto do edge da Cloudflare, sem header `x-deployment-id`, ou seja, o request **nem chega** ao handler de assets do Worker do app. Indica que o ambiente de publish não está aplicando o SPA fallback configurado (`wrangler.jsonc` `assets.not_found_handling: "single-page-application"` nem `dist/_redirects`).

## Identificadores

- Lovable Project ID: `5d254dca-0024-4a02-a120-69066bc5955b`
- Domínio publicado: `https://preciflow.lovable.app`
- Context ID desta investigação: `6951EAA2-1264-4A1A-A86D-817E462202C7`
- Deployment ID atual (visto em `/`): `82cf5dc55c8eef56673c41a41475f1d1824ebb1635b703eeb2125f8c91c79d84`

## Evidência 1 — Resposta HTTP uniforme em várias rotas

Coletado em 11/05/2026:

```
$ for p in /produtos /auth /landing /qualquer-coisa-inexistente /; do
    curl -sI -o /dev/null -w "$p -> HTTP %{http_code}\n" "https://preciflow.lovable.app$p"
  done
/produtos                    -> HTTP 404
/auth                        -> HTTP 404
/landing                     -> HTTP 404
/qualquer-coisa-inexistente  -> HTTP 404
/                            -> HTTP 200
```

Headers detalhados:

```
$ curl -sI https://preciflow.lovable.app/produtos
HTTP/2 404
content-type: text/plain;charset=UTF-8
server: cloudflare
cf-ray: 9fa41e7149003f12-LHR
(SEM x-deployment-id)

$ curl -sI https://preciflow.lovable.app/auth
HTTP/2 404
content-type: text/plain;charset=UTF-8
server: cloudflare
cf-ray: 9fa41e734fab958a-LHR
(SEM x-deployment-id)

$ curl -sI https://preciflow.lovable.app/landing
HTTP/2 404
content-type: text/plain;charset=UTF-8
server: cloudflare
cf-ray: 9fa41e752d8d93fe-LHR
(SEM x-deployment-id)

$ curl -sI https://preciflow.lovable.app/qualquer-coisa-inexistente
HTTP/2 404
content-type: text/plain;charset=UTF-8
server: cloudflare
cf-ray: 9fa41e771b2ccdaf-LHR
(SEM x-deployment-id)

$ curl -sI https://preciflow.lovable.app/
HTTP/2 200
content-type: text/html; charset=utf-8
x-deployment-id: 82cf5dc55c8eef56673c41a41475f1d1824ebb1635b703eeb2125f8c91c79d84
server: cloudflare
cf-ray: 9fa41e790b77419c-LHR
```

Pontos críticos:
- Apenas `/` recebe `x-deployment-id` → apenas a raiz é servida pelo deployment do app.
- As demais URLs retornam `text/plain` 404 do Cloudflare, sem `x-deployment-id` → o request não está sendo entregue ao handler de assets do Worker. O `not_found_handling: "single-page-application"` simplesmente não é avaliado.

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

## Evidência 5 — Escopo do bug

**Todas as URLs do domínio publicado retornam 404, exceto `/`.** Isso inclui:

- Rotas declaradas em `src/routes/`: `/produtos`, `/kits`, `/configuracoes`, `/materias-primas`, `/receitas`, `/assinatura`, `/landing`, `/auth`, `/cancelado`, `/sucesso`
- URLs inexistentes (que deveriam cair no SPA fallback e servir `index.html` com 200 para o roteador cliente decidir): também retornam 404
- Único endpoint funcional: `https://preciflow.lovable.app/` → 200

Como uma rota inexistente arbitrária (`/qualquer-coisa-inexistente`) também retorna 404 sem `x-deployment-id`, fica descartado que o problema seja de configuração de rota no app — é o SPA fallback do hosting que não está sendo aplicado.

## Tentativas anteriores descartadas

1. **Plugin `prerenderStaticRoutes()` em `vite.config.ts`** — workaround que copiava `dist/index.html` para `dist/<rota>/index.html`. Removido porque (a) falhava silenciosamente em `closeBundle` em builds com múltiplos environments, (b) exigia manutenção manual a cada nova rota, (c) cria semântica conflitante com SPA fallback. Não é solução, é remendo.
2. **HashRouter / BrowserRouter (react-router-dom)** — descartado: o projeto usa TanStack Router file-based, e a documentação oficial do Lovable orienta explicitamente a não usar essas abordagens.
3. **Editar `src/routeTree.gen.ts`** — descartado por ser arquivo gerado.

## Conclusão técnica e pedido ao suporte

Todas as configurações necessárias do lado do código estão corretas e validadas no build local. O comportamento esperado é: qualquer URL não correspondente a um asset físico em `dist/` deve servir `dist/index.html` com status 200, deixando o TanStack Router resolver a rota no cliente. O ambiente de hosting do Lovable está, em vez disso, retornando 404 do Cloudflare diretamente, sem invocar o SPA fallback nem entregar o request ao Worker do app.

**Pedidos ao suporte:**

1. Confirmar se o `wrangler.jsonc` deste projeto está sendo aplicado pelo deployment atual (deployment ID `82cf5dc55c8eef56673c41a41475f1d1824ebb1635b703eeb2125f8c91c79d84`).
2. Confirmar se o `dist/_redirects` é considerado pelo runtime de hosting do Lovable para esta classe de projeto (TanStack Start sem SSR).
3. Verificar se há alguma flag/configuração no nível do workspace ou projeto que precise ser ativada para que o SPA fallback funcione.
4. Investigar por que requests para rotas além de `/` não chegam ao Worker do app (ausência de `x-deployment-id`).
