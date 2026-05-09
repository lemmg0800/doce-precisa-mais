# Além das correções já planejadas, revisar todo o projeto para garantir que nenhum código browser-only execute durante SSR/publicação.

Verificar especialmente:

- localStorage
- sessionStorage
- window
- document
- navigator
- Stripe browser SDK
- listeners globais

Garantir que:

- qualquer acesso browser-only ocorra apenas dentro de:
  - useEffect
  - handlers
  - eventos do cliente

Nunca em:

- topo de módulo
- providers globais
- imports
- inicializações automáticas

---

Verificar também:

- guards de autenticação
- providers de assinatura
- providers de sessão
- listeners de foco/visibilitychange

para impedir re-renderizações globais e crashes silenciosos no ambiente publicado.

---

Objetivo:

- eliminar definitivamente o Internal server error
- garantir compatibilidade total com SSR/publicação do Lovable
- manter preview e produção funcionando igualmente  
  
Plano para corrigir o “Internal server error” no site publicado

## O que vou corrigir

1. Remover do bundle do servidor os módulos que hoje são carregados globalmente e são fortes candidatos ao crash em produção.
2. Tornar esses trechos estritamente client-only, sem alterar o fluxo funcional da aplicação.
3. Validar o preview e deixar o projeto pronto para você publicar novamente.

## Causa mais provável encontrada

Há dois pontos de risco claros para SSR/publicação:

- `src/components/MateriaImportDialog.tsx` importa `xlsx` no topo do arquivo, e esse componente é importado por `src/routes/materias-primas.tsx`. Como o roteador gera um bundle global de rotas, um módulo pesado/incompatível pode derrubar o SSR inteiro no ambiente publicado.
- `src/integrations/lovable/index.ts` cria `createLovableAuth()` em nível de módulo. Como `src/routes/auth.tsx` entra no grafo de rotas, isso também pode acabar sendo avaliado cedo demais no servidor.

O preview local pode continuar funcionando enquanto a publicação quebra, porque o runtime publicado é mais restrito.

## Implementação

### 1) Isolar a importação de planilhas

- Tirar `xlsx` do import estático em `MateriaImportDialog`.
- Carregar `xlsx` somente dentro das ações do navegador (download do modelo e leitura do arquivo), via import dinâmico.
- Manter exatamente a mesma UX da importação.

### 2) Isolar a autenticação OAuth para o cliente

- Remover a criação imediata de `createLovableAuth()` em nível de módulo.
- Passar a instanciar o helper de OAuth apenas quando o usuário clicar para entrar com Google.
- Preservar login normal com e-mail/senha e o fluxo OAuth atual.

### 3) Endurecer o código para SSR

- Garantir que nenhum acesso de browser-only rode durante carregamento de módulo.
- Limitar `window.location`, redirecionamentos e integrações de browser a handlers/eventos do cliente.

### 4) Validar antes de encerrar

- Conferir se o preview continua renderizando normalmente.
- Verificar se a estrutura continua pronta para publicação.
- Te orientar a clicar em **Update** no publish, porque mudanças de frontend só entram no ar depois disso.

## Resultado esperado

- O site publicado deixa de mostrar “Internal server error”.
- A aplicação volta a abrir em `/` e nas rotas internas.
- Importação de planilha e login com Google continuam funcionando, mas sem quebrar a publicação.

## Detalhes técnicos

```text
routeTree -> importa todas as rotas
  /materias-primas -> importa MateriaImportDialog -> import estático de xlsx
  /auth -> importa lovable auth helper -> criação em nível de módulo

No runtime publicado, qualquer módulo incompatível no grafo SSR pode derrubar
não só a rota afetada, mas toda a renderização do app.
```

## Depois da correção

Assim que eu aplicar, teste no preview e depois publique de novo com **Update** para o novo bundle entrar no ar.