# Corrigir 404 em /landing

## Causa
Em `vite.config.ts`, o plugin `prerenderStaticRoutes` gera um `index.html` para cada rota listada em `STATIC_ROUTES`. Sem isso, ao acessar a URL diretamente (ou recarregar a página) no site publicado, o servidor não encontra o arquivo e retorna 404.

A lista atual inclui `auth`, `assinatura`, `sucesso`, `cancelado`, `materias-primas`, `produtos`, `receitas`, `kits`, `configuracoes` — mas **não inclui `landing`**, que foi criada depois.

## Mudança
Adicionar `"landing"` ao array `STATIC_ROUTES` em `vite.config.ts`. Após o próximo build, `/landing/index.html` será gerado e a rota funcionará ao ser acessada diretamente em `preciflow.lovable.app/landing`.

## Arquivos afetados
- `vite.config.ts` — incluir `"landing"` em `STATIC_ROUTES`.

Nada mais precisa mudar: a rota já existe (`src/routes/landing.tsx`), já está em `PUBLIC_PATHS` no `__root.tsx`, e o `routeTree.gen.ts` já a registra.
