## Plano: Migrar de TanStack Router para React Router (compatível com a stack Vite React da Lovable)

A equipe de deploy identificou que o uso do TanStack Router (com roteamento baseado em arquivos e `routeTree.gen.ts`) entra em conflito com a forma como a Lovable faz deploy de apps Vite React, fazendo as rotas profundas voltarem a dar "not found" a cada novo deploy. A solução é trocar pelo `react-router-dom`, padrão da stack.

### O que vai mudar

**Dependências**
- Adicionar: `react-router-dom`
- Remover: `@tanstack/react-router`, `@tanstack/router-plugin`

**Arquivos de configuração**
- `vite.config.ts` — remover o plugin `TanStackRouterVite(...)`.
- `wrangler.jsonc` — remover (não é usado pela hospedagem Lovable; sua presença é parte do que confunde o deploy).
- `public/_redirects` — remover (a Lovable já faz fallback SPA automaticamente).
- `src/routeTree.gen.ts` — deletar.
- `src/router.tsx` — substituir por um `createBrowserRouter` simples (ou usar `<BrowserRouter>` direto em `main.tsx`).
- `src/main.tsx` — montar `<BrowserRouter>` / `<RouterProvider>` do `react-router-dom`.

**Rotas (todos os arquivos em `src/routes/`)**
Cada arquivo hoje exporta `Route = createFileRoute(...)({ component, head })`. Vou converter para componentes React puros e centralizar o mapeamento de rotas + `<meta>`/`<title>` em um único lugar:

- Manter os arquivos `src/routes/*.tsx` exportando apenas o componente da página (sem `createFileRoute`, sem `head`).
- Criar `src/routes/index.tsx` (rota `/`), `auth`, `assinatura`, `sucesso`, `cancelado`, `landing`, `configuracoes`, `kits`, `materias-primas`, `produtos`, `receitas` como `<Route>` no novo router.
- Criar um pequeno helper `usePageMeta({ title, description })` para preservar o SEO que hoje vive em `head()` (atualiza `document.title` e meta tags via `useEffect`).
- Converter `__root.tsx` em um `RootLayout` que renderiza `<AuthProvider>` + `<AuthGate>` + `<Outlet />` do react-router-dom, e o `NotFoundComponent` vira a rota catch-all `path="*"`.

**Imports a trocar em todo o projeto** (arquivos afetados: `AccessGate.tsx`, `AppShell.tsx`, `useSubscription.ts`, e todas as páginas em `src/routes/`):
- `import { Link } from "@tanstack/react-router"` → `import { Link } from "react-router-dom"` (e `to="/x"` continua igual; trocar `<Link to="/x">` continua válido).
- `useNavigate()` — API equivalente; trocar `navigate({ to: "/x" })` por `navigate("/x")`.
- `useLocation()` — mesma forma de uso (`loc.pathname`), só muda o import.
- `useRouter().invalidate()` (em `src/router.tsx` error component) — remover, usar `window.location.reload()` ou `navigate(0)`.

**SEO / `<head>`**
Cada rota hoje define `head()` com `<title>` e meta tags. Vou preservar isso via o helper `usePageMeta` chamado no topo de cada página, mantendo os mesmos títulos e descrições atuais. (Se preferir, posso instalar `react-helmet-async` — mas o helper manual é mais leve e suficiente.)

### Comportamento esperado após a migração

- Mesmas URLs, mesmas páginas, mesmo visual.
- `/produtos`, `/receitas`, etc. continuam funcionando ao recarregar e em links diretos — a Lovable serve `index.html` automaticamente como fallback SPA.
- Deploys futuros não vão mais ser "misread" pela infra, porque o projeto vira um Vite + React Router padrão.

### Detalhes técnicos

- Estrutura final do router (resumo):
  ```text
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route element={<AuthGate />}>        // gate + AccessGate
          <Route path="/" element={<Index />} />
          <Route path="/produtos" element={<Produtos />} />
          ...rotas protegidas
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/assinatura" element={<Assinatura />} />
          <Route path="/sucesso" element={<Sucesso />} />
          <Route path="/cancelado" element={<Cancelado />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
    <Toaster />
  </BrowserRouter>
  ```
- O `AuthGate` decide entre `<Outlet />` direto (rotas públicas / não logado) e `<AccessGate><Outlet /></AccessGate>` (rotas privadas autenticadas), mantendo a mesma lógica atual.
- Nenhuma alteração em `usePricingStore`, Supabase, cálculos de produtos/receitas/kits, ou edge functions. Apenas roteamento e SEO de página.

### O que NÃO vou mexer

- Lógica de negócio (preços, receitas, kits, materiais).
- Supabase / Lovable Cloud / edge functions.
- Design, componentes UI, Tailwind, store Zustand.

Posso seguir com a migração?
