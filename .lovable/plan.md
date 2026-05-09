## Diagnóstico definitivo (com base nos logs do publicado)

Os logs do worker publicado (timestamp 22:09Z, deploy mais recente) mostram **exatamente o mesmo erro** que tínhamos antes:

```
Error: No such module "assets/h3-v2".
imported from "assets/server-ISe0wj1A.js"
```

Ou seja: **o wrapper `src/server.ts` que adicionamos para "capturar" o erro é, ele próprio, a causa do crash do worker em produção.**

### Por que o wrapper quebra o deploy

A solução do wrapper que aplicamos pressupõe que o build do Vite empacote `src/server.ts` junto com toda a árvore do TanStack Start no mesmo bundle (`dist/server/`), e que o deploy seja feito a partir desse `dist/server/wrangler.json` gerado pelo build (é assim que o TanStack Start oficialmente publica em Cloudflare — confirmado pela documentação do Cloudflare e por uma SO recente sobre o mesmo erro).

No nosso projeto, o `wrangler.jsonc` na raiz aponta `main: "src/server.ts"`. Quando o pipeline de publish da Lovable invoca o wrangler com esse arquivo, o esbuild interno do wrangler tenta empacotar `src/server.ts` direto da fonte e faz `import("@tanstack/react-start/server-entry")`. O bundle gerado por essa rota **referencia internamente um chunk `assets/h3-v2` que só existiria se o build tivesse sido feito pelo plugin do Vite do TanStack Start**. Como o wrangler não gera esse chunk, o import falha e **toda requisição volta 500**.

Em outras palavras: o wrapper foi a tentativa correta para o problema errado. O erro original ("Internal server error") provavelmente vinha de um throw em SSR (loader / módulo) que precisa ser tratado dentro da árvore React, não no nível do worker.

## O plano

### 1. Remover o wrapper completamente

- Apagar `src/server.ts`
- Apagar `src/lib/error-capture.ts` e `src/lib/error-page.ts`
- Em `vite.config.ts`, remover o bloco `tanstackStart.server.entry` (deixar o plugin usar o entry padrão `@tanstack/react-start/server-entry`)
- Em `wrangler.jsonc`, voltar `main` para o entry padrão do template (ou remover `main` se o pipeline de publish da Lovable resolve automaticamente o `dist/server/wrangler.json` do build)

### 2. Confirmar que o erro original retorna (ou não) e diagnosticar com as ferramentas certas

Sem o wrapper interferindo, podemos finalmente ver o erro real do SSR nos logs do publicado. Hipóteses prováveis para o "Internal server error" original:

- Algum **module-level side effect** quebrando em SSR (ex.: `localStorage`, `window`, `document` sendo acessados na importação de um componente). Nosso `client.ts` já protege `storage` com `typeof window !== 'undefined'`, mas componentes ou stores podem estar tocando `window` direto.
- Algum **loader de rota** chamando `createServerFn` que falha silenciosamente.

### 3. Garantir tratamento robusto de erros dentro da árvore React (sem mexer no worker)

- Confirmar que `__root.tsx` tem `errorComponent` (não só `notFoundComponent`).
- Garantir que `defaultErrorComponent` no `router.tsx` continua existindo (já está).
- Em qualquer rota com `loader`, garantir `errorComponent` + `notFoundComponent`.

### 4. Publicar e validar

Depois de remover o wrapper:
1. Você clica em **Update** no menu Publish.
2. Eu leio os logs reais do worker publicado.
3. Se o erro original voltar, agora vamos vê-lo de verdade no stack trace e corrigir a raiz (provavelmente um arquivo específico). Se não voltar, o problema estava 100% no próprio wrapper.

## O que NÃO vou fazer

- Não vou tentar nenhuma outra "captura de erro" no nível do worker — já provamos que essa abordagem está incompatível com como o deploy da Lovable empacota o worker.
- Não vou mexer em Stripe, auth ou importação — todas continuam intactas.

Aprove para eu executar os passos 1–3. Depois você publica e eu valido com os logs reais.
