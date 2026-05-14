## Objetivo

Fazer com que, quando o usuário recolher (ou expandir) uma categoria na tela de Produtos, essa escolha seja lembrada após atualizar a página ou sair e entrar novamente.

## Como vai funcionar

- Ao recolher/expandir uma categoria, salvamos a lista de categorias abertas no `localStorage` do navegador, com uma chave por usuário (ex.: `preciflow:produtos:categorias-abertas:<userId>`).
- Ao abrir a página, lemos esse valor:
  - Se existir, usamos exatamente o que o usuário deixou da última vez (categorias recolhidas continuam recolhidas).
  - Se não existir (primeiro acesso), abrimos todas por padrão, como hoje.
- Categorias novas criadas depois entram já expandidas; categorias excluídas somem da memória automaticamente.

## Escopo / limites

- Persistência por **navegador + usuário**. Se a pessoa logar em outro dispositivo ou navegador, começa com tudo expandido naquele aparelho. Não sincroniza entre dispositivos (não envolve banco).
- Aplica-se apenas à tela `/produtos`. Outras telas com accordion não são afetadas.
- Sem alterações de backend, banco de dados ou autenticação.

## Detalhes técnicos

- Arquivo afetado: `src/routes/produtos.tsx`.
- Trocar a inicialização do `useState<string[]>([])` + `useEffect` que abre tudo por:
  - `useState` inicializado a partir de `localStorage.getItem(chave)` (lazy initializer).
  - Um `useEffect` que grava `expandedCats` no `localStorage` sempre que mudar.
  - Obter `userId` via `supabase.auth.getUser()` (ou do `AuthProvider` existente) para compor a chave; enquanto não houver user, usar chave anônima.
- Tratamento defensivo: `try/catch` em volta do acesso ao `localStorage` (modo privado/SSR).
- Nada precisa mudar no componente `Accordion` em si — ele já é controlado por `value` / `onValueChange`.
