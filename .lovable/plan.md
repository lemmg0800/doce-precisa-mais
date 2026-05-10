## Por que isso acontece

O projeto é uma SPA (Single Page Application) construída com Vite + TanStack Router. Toda a navegação (`/produtos`, `/materias-primas`, `/kits`, etc.) acontece **no navegador** — esses caminhos não existem como arquivos no servidor.

Quando você está em `/` e navega clicando nos links, o React Router troca a tela sem pedir nada ao servidor. Mas quando você dá **F5 em `/materias-primas`**, o navegador faz uma requisição HTTP real para esse caminho. O servidor procura um arquivo chamado `materias-primas` e, como não existe, devolve **"Not Found"**.

Em `/` funciona porque existe `index.html` na raiz, então o servidor encontra e devolve normalmente.

A solução padrão para SPA é dizer ao servidor: *"para qualquer URL que não seja um arquivo real, devolva sempre o `index.html`"*. Aí o JavaScript do TanStack Router carrega e renderiza a página correta no cliente.

## O que fazer

Criar um arquivo de fallback de SPA que o host (Cloudflare) entende, redirecionando todas as rotas desconhecidas para o `index.html` com status 200 (não 301/302, para preservar a URL na barra do navegador).

### Arquivo a criar

```text
public/_redirects
```

Conteúdo:

```text
/*    /index.html   200
```

Esse arquivo é copiado automaticamente pelo Vite para o build final. O Cloudflare lê o `_redirects` e passa a entregar o `index.html` para qualquer caminho que não corresponda a um asset real (JS, CSS, imagens continuam funcionando normalmente).

### Resultado esperado

- F5 em `/produtos`, `/materias-primas`, `/kits`, `/receitas`, `/configuracoes`, `/assinatura` → carrega a página corretamente.
- URLs colados/compartilhados de qualquer rota → abrem direto na página certa.
- Assets (favicon, imagens, JS, CSS) continuam servidos normalmente.
- O `notFoundComponent` do TanStack Router continua aparecendo apenas para rotas que realmente não existem no app (ex: `/qualquer-coisa-inventada`), e não mais para refresh de páginas válidas.

## Detalhes técnicos

- O template originalmente foi gerado para TanStack **Start** (com SSR), por isso o `wrangler.jsonc` aponta para `@tanstack/react-start/server-entry`. Mas o pacote `@tanstack/react-start` **não está instalado** — o projeto na prática roda como SPA estática usando apenas `@tanstack/react-router`. Por isso o fallback de SPA via `_redirects` é a abordagem correta aqui (em vez de configurar SSR, que exigiria reescrever vários arquivos).
- Não é necessário tocar em `vite.config.ts`, `wrangler.jsonc`, `__root.tsx` nem no `routeTree.gen.ts`.
- Não é preciso reiniciar nada: após o deploy/republish, o `_redirects` passa a valer.

## Plano de implementação

1. Criar `public/_redirects` com a regra `/*  /index.html  200`.
2. Pedir para você testar dando F5 em `/materias-primas` e em outras rotas internas.
