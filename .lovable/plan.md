## Problema

No card de cada produto na aba **Produtos**, quando há receita reutilizável vinculada, o valor exibido ao lado do nome da receita está absurdamente alto.

Exemplo do usuário:
- Receita "Massa podre": custo total R$ 7,78 / rendimento 900 g → R$ 0,00864 por g
- Produto "Empadinha" usa 350 g dessa receita
- Esperado: ~R$ 3,03 (ou ~R$ 3,50 considerando arredondamento por grama)
- Exibido: **R$ 3.150,00**

## Causa

Em `src/routes/produtos.tsx`, linhas 259–260:

```ts
const custoInteira = custoUnitarioReceita(r, materias) * (r.rendimento || 0);
const custoTotal   = custoInteira * (pr.quantidade_utilizada || 0);
```

Isso multiplica o custo unitário pelo **rendimento da receita** (gerando o custo total da receita inteira) e depois multiplica de novo pela **quantidade usada no produto**. Resultado: `custo_unit × rendimento × quantidade` em vez de `custo_unit × quantidade`.

Com arredondamento (round2 do `custoUnitarioReceita`):
0,01 × 900 × 350 = **3.150** ← bate exatamente com o que aparece na tela.

O cálculo dentro de `calcularProduto` (store, linha ~857) já está correto: `custoUnitarioReceita(r) × pr.quantidade_utilizada`. O bug existe apenas na exibição do detalhe da receita no card.

## Correção

Em `src/routes/produtos.tsx`, substituir as duas linhas por:

```ts
const custoTotal = custoUnitarioReceita(r, materias) * (pr.quantidade_utilizada || 0);
```

Remover a variável `custoInteira` (não é usada em mais nenhum lugar).

## Escopo

- Apenas `src/routes/produtos.tsx`.
- Sem mudanças em store, schema, banco ou no `calcularProduto` (que já está correto, então o "Custo" total do produto, "Mínimo" e "Sugerido" do card já estavam certos — o bug era só o número ao lado do nome da receita).

## Resultado esperado

Para 350 g da massa podre: passa a exibir ~R$ 3,50 (com o arredondamento por grama atual), batendo com o que entra na composição do custo do produto.
