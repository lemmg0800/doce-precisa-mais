# Plano — Reforçar escopo do bug no relatório de suporte

## Objetivo

Ajustar `.lovable/plan.md` para que o suporte do Lovable entenda de imediato que **o SPA fallback está totalmente quebrado neste deployment**: qualquer URL diferente de `/` retorna 404 do Cloudflare, sem passar pelo handler de assets do Worker. Hoje o documento usa `/produtos` como exemplo principal e isso pode ser interpretado como problema de rota específica.

## Mudanças no `.lovable/plan.md`

1. **Resumo (topo)** — trocar "Acesso direto a qualquer rota além de `/`" por uma frase mais incisiva:
   > Toda e qualquer URL diferente de `/` retorna HTTP 404 do Cloudflare neste deployment. O problema não é específico de `/produtos` — afeta 100% das rotas filhas, incluindo rotas que existem em `src/routes/` e rotas inexistentes (que também deveriam cair no SPA fallback servindo `index.html`).

2. **Evidência 1 (curl)** — expandir a coleta de evidências para mostrar que o 404 é uniforme. Adicionar respostas HTTP de pelo menos 4 rotas diferentes:
   - `/produtos` (rota existente)
   - `/auth` (rota existente, atualmente em uso pelo usuário)
   - `/landing` (rota existente)
   - `/qualquer-coisa-inexistente` (deveria cair no fallback e servir index.html com 200 — mas retorna 404)
   
   Mostrar que **nenhuma** delas tem `x-deployment-id`, confirmando que o request nem chega ao Worker do app.

3. **Evidência 5 (URLs)** — reescrever como:
   > **Escopo do bug:** todas as URLs do domínio publicado retornam 404, exceto `/`. Isso inclui:
   > - Rotas declaradas em `src/routes/`: `/produtos`, `/kits`, `/configuracoes`, `/materias-primas`, `/receitas`, `/assinatura`, `/landing`, `/auth`, `/cancelado`, `/sucesso`
   > - URLs inexistentes (que deveriam ser tratadas pelo SPA fallback servindo `index.html` com 200, deixando o roteador cliente decidir): também retornam 404
   > 
   > Único endpoint funcional: `https://preciflow.lovable.app/` → 200

4. **Conclusão técnica** — adicionar uma frase final pedindo ao suporte para confirmar:
   - Se o `wrangler.jsonc` deste projeto está sendo aplicado pelo deployment atual
   - Se o `dist/_redirects` é considerado pelo runtime de hosting do Lovable
   - Se há alguma flag/configuração no nível do workspace ou projeto que precisa ser ativada para que o SPA fallback funcione

5. **Manter intactas** todas as outras seções (Evidência 2 wrangler.jsonc, Evidência 3 _redirects, Evidência 4 build local, Tentativas descartadas) — já estão corretas.

## Após a atualização

O arquivo `.lovable/plan.md` ficará pronto para você copiar/colar no Discord (`#help`) ou anexar no email para `support@lovable.dev`, junto com:
- Context ID: `6951EAA2-1264-4A1A-A86D-817E462202C7`
- Project ID: `5d254dca-0024-4a02-a120-69066bc5955b`
- URL afetada: `https://preciflow.lovable.app`

## O que NÃO será feito

- Não vou tentar mais workarounds em código (prerender, HashRouter, edição de `routeTree.gen.ts`) — todos já foram descartados com justificativa no próprio relatório.
- Não vou abrir o chamado em seu nome — isso precisa partir de você nos canais oficiais.
