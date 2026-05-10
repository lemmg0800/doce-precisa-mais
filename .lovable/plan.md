## Objetivo
Garantir que cada rota principal (`/auth`, `/sucesso`, `/produtos`, etc.) exista como arquivo HTML próprio no build final, para que o domínio publicado abra links diretos e refresh sem depender de fallback de hospedagem.

## Contexto atual
O projeto já contém a base do plano B:
- `package.json` já roda `vite build && node scripts/prerender.mjs`
- `scripts/prerender.mjs` já copia `dist/index.html` para rotas estáticas
- o `dist/` local já tem pastas como `auth/`, `sucesso/`, `produtos/` com `index.html`

Então a próxima implementação não é “inventar” o plano B, e sim consolidá-lo para publicação e validar o resultado no domínio ao vivo.

## Plano
1. Revisar o gerador de HTML das rotas
- Confirmar que ele cobre todas as rotas públicas e privadas que precisam abrir direto por URL.
- Garantir que ele ignore apenas rotas dinâmicas/auxiliares e não deixe nenhuma rota real de fora.
- Se necessário, trocar a detecção por nome de arquivo por uma lista explícita de rotas estáticas para evitar falhas silenciosas.

2. Ajustar o build para publicação previsível
- Manter o pós-build de pré-renderização como parte oficial do processo de build.
- Evitar soluções paralelas que possam confundir o deploy, deixando o fluxo centrado no HTML físico por rota.

3. Validar a independência das páginas
- Verificar que `/auth`, `/assinatura`, `/sucesso`, `/cancelado`, `/materias-primas`, `/produtos`, `/receitas`, `/kits` e `/configuracoes` abrem sem passar pela home.
- Confirmar que o roteamento do app continua funcionando normalmente depois que cada rota é servida pelo seu próprio `index.html`.

4. Conferir o publicado
- Depois da implementação, validar no domínio publicado que acessar a URL direta retorna a página correta em vez de `not found`.
- Testar especialmente `/auth`, já que é a rota onde o problema aparece agora.

## Detalhes técnicos
- Fonte das rotas: `src/routes/*.tsx`
- Build atual: `vite build` + script `scripts/prerender.mjs`
- Estratégia: gerar `dist/<rota>/index.html` para cada rota estática
- Resultado esperado no build:
```text
/dist/auth/index.html
/dist/sucesso/index.html
/dist/produtos/index.html
...
```

## Validação final
Vou considerar concluído quando:
- o build gerar HTML físico para todas as rotas estáticas relevantes
- abrir `/auth` diretamente não der mais 404/not found
- refresh em páginas internas continuar funcionando
- links externos/retorno de pagamento para `/sucesso` também abrirem corretamente