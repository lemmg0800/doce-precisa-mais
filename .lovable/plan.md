## Diagnóstico

O site publicado retorna **502 Internal Server Error** em todas as rotas. Os logs do Worker mostram:

```
Error: No such module "h3-v2". imported from "server.js"
```

O problema foi introduzido na última alteração do `vite.config.ts`, onde o plugin `tanstackStart` foi configurado com overrides de `srcDirectory` e `router.entry: "./router.tsx"`. Isso desviou o build do server-entry padrão (`@tanstack/react-start/server-entry`) que o `wrangler.jsonc` espera carregar — resultando em um bundle Worker quebrado, sem o módulo `h3-v2` que o framework usa internamente.

Em `vite dev` o servidor funciona porque o Vite resolve os módulos em runtime; em produção o Cloudflare Worker exige tudo bundleado corretamente.

## Plano de correção

### 1. Restaurar o `vite.config.ts` para a forma padrão do TanStack Start

Remover os overrides que quebram o bundle do Worker. Usar apenas o plugin com defaults (que geram o server-entry corretamente):

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: { host: true, port: 3000, strictPort: false },
});
```

### 2. Garantir que `src/router.tsx` continua exportando `getRouter`

Já está correto. O TanStack Start, com defaults, descobre `src/router.tsx` automaticamente.

### 3. Manter `import "./styles.css"` em `src/router.tsx`

Já adicionado na correção anterior — preserva o Tailwind tanto em SSR quanto no preview.

### 4. Manter `public/_redirects`

Não atrapalha; serve como fallback adicional.

## Resultado esperado

- Build de produção volta a gerar o Worker corretamente, com `h3-v2` resolvido.
- `https://alquimista-precifica.lovable.app/` e todas as sub-rotas (`/produtos`, `/receitas`, `/kits`, `/materias-primas`, `/ajustes`) carregam normalmente.
- F5 em qualquer rota funciona no site publicado.
- Preview continua com cores/Tailwind aplicados.

## Observações

- Após aplicar a correção, será necessário clicar em **Update** no menu **Publish** novamente para o build novo ir ao ar.
- Nenhuma mudança em rotas, autenticação ou lógica de assinatura — apenas configuração de build.
