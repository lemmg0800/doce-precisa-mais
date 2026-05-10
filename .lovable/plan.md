## Problema confirmado

O domínio publicado `preciflow.lovable.app` retorna **404** para `/auth`, `/sucesso` e demais rotas (apenas `/` responde 200). O pipeline de publish da Lovable não usa o `scripts/prerender.mjs` que adicionamos — ele faz o próprio build e só publica o que o framework gera nativamente, então os arquivos `dist/auth/index.html` nunca chegam ao hosting.

## Plano C — pré-render no diretório `public/`

Tudo que está em `public/` é copiado tal e qual para a raiz do site publicado. Vamos criar um HTML "shell" idêntico ao `index.html` para cada rota da aplicação, dentro de `public/<rota>/index.html`. Como é um SPA, qualquer um desses HTMLs carrega o mesmo bundle React, e o TanStack Router renderiza a rota correta a partir da URL — eliminando o 404 em F5, retorno do Stripe ou link compartilhado.

### Passos

1. **Criar script `scripts/generate-static-routes.mjs`**
   - Lê `index.html` da raiz do projeto
   - Para cada rota pública listada explicitamente, escreve `public/<rota>/index.html` com o mesmo conteúdo
   - Lista de rotas: `auth`, `assinatura`, `sucesso`, `cancelado`, `materias-primas`, `produtos`, `receitas`, `kits`, `configuracoes`
   - Adiciona `.gitignore` interno apenas para os HTMLs gerados não serem confundidos com arquivos manuais (opcional)

2. **Rodar o script uma vez** para commitar os HTMLs em `public/auth/index.html`, `public/sucesso/index.html`, etc.
   - Esses arquivos passam a fazer parte do repositório e são publicados automaticamente pelo hosting estático da Lovable

3. **Adicionar passo `prebuild`** no `package.json` para regenerar os HTMLs a partir do `index.html` sempre que ele mudar (mantém os shells em sincronia se títulos, metas ou scripts forem ajustados):
   ```json
   "prebuild": "node scripts/generate-static-routes.mjs"
   ```

4. **Limpar o passo antigo de prerender em `dist/`** (`scripts/prerender.mjs` e os sufixos no `build`/`build:dev`), já que agora a fonte de verdade está em `public/`. Mantemos o `build` enxuto: `vite build`.

5. **Manter `public/_redirects`** como rede de proteção (`/*  /index.html  200`) para qualquer rota dinâmica futura que ainda não tenha HTML próprio.

### Resultado esperado

Após publicar:
- `https://preciflow.lovable.app/auth` → 200, carrega a tela de login
- `https://preciflow.lovable.app/sucesso` → 200, recebe o retorno do Stripe sem 404
- Todas as demais rotas listadas funcionam por acesso direto, F5 e link compartilhado
- A home continua funcionando como antes

### Ação do usuário

Após a implementação, **clicar em Publish → Update** no editor para que o novo build com os HTMLs em `public/` vá ao ar.
