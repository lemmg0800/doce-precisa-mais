## Problema

Ao trocar de aba/programa e voltar ao navegador, a tela exibe "Verificando assinatura..." em tela cheia e desmonta o formulário em edição, fazendo o usuário perder o que estava digitando (ingrediente, produto, receita ou kit).

## Causa raiz

Em `src/hooks/useSubscription.ts`:

1. O callback `load` é memoizado com `useCallback(..., [user])` — depende do **objeto `user` inteiro**.
2. Em `AuthProvider`, sempre que o navegador volta ao foco, o Supabase dispara `TOKEN_REFRESHED` e chama `setSession(s)` com um **novo objeto session** (mesmo `user.id`, referência diferente).
3. Como `user` é uma nova referência, o `useCallback` recria `load`, o `useEffect([ready, load])` dispara de novo e executa `load(false)` — que faz `setLoading(true)`.
4. `AccessGate` observa `loading` e renderiza o overlay "Verificando assinatura...", desmontando toda a árvore filha (incluindo o formulário aberto).

A proteção que já existe em `AuthProvider` (ignorar `TOKEN_REFRESHED` para não chamar `loadAll`) não cobre esse caso, porque o problema é o efeito reagir à **mudança de referência** do `user`.

## Correção

Toda a alteração fica em `src/hooks/useSubscription.ts` — sem mudar UI, store, ou lógica de assinatura.

1. **Estabilizar a dependência:** trocar `[user]` por `[user?.id]` no `useCallback` de `load` e nos `useEffect`s. Assim, refresh de token (mesmo `id`) não recria o callback nem dispara recarga.
2. **Carregar uma única vez por usuário:** usar um `ref` (`loadedForUserIdRef`) para garantir que `load(false)` (com loading visível) rode **apenas na primeira vez** que o `user.id` é conhecido. Trocas de usuário continuam disparando recarga normal; volta de aba não dispara nada.
3. **Refresh ao mudar de rota permanece silencioso** (já está com `load(true)` e janela de 30s) — atende exatamente o que você pediu: "verificação ao navegar entre produtos, configurações, kits".
4. **Refresh em background a cada 5 min permanece silencioso** — não afeta a UI.

## Resultado esperado

- Trocar de aba e voltar: nenhum overlay, formulário preservado.
- Trocar de programa e voltar: idem.
- Navegar entre rotas internas: assinatura é revalidada em segundo plano sem flash.
- Login/logout: comportamento inalterado.
- Verificação inicial após login: continua mostrando "Verificando assinatura..." normalmente.

## Arquivos afetados

- `src/hooks/useSubscription.ts` (única alteração)