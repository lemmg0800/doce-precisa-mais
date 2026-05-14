## Problema

Hoje o sistema mostra os custos arredondados para 2 casas (ex.: custo do kit "0,29"), mas internamente trabalha com o valor completo (ex.: 0,2860). Quando o produto multiplica `custo_kit × rendimento` (8 kits), o cálculo usa 0,2860 × 8 = 2,288 → exibe 2,29, em vez do esperado 8 × 0,29 = 2,32.

## Solução

Arredondar para 2 casas (HALF_UP) os valores de custo no momento em que são calculados, para que os cálculos seguintes usem exatamente o mesmo número que aparece na tela.

## Onde aplicar

Em `src/store/usePricingStore.ts`:

1. Criar helper `round2(n)` que arredonda para 2 casas (HALF_UP, ex.: `Math.round(n * 100) / 100`).
2. Aplicar `round2` no retorno das funções base:
   - `custoTotalKit` → custo final do kit
   - `custoTotalReceita` → custo total da receita
   - `custoUnitarioReceita` → custo por g/ml/un
3. Em `calcularProduto`, arredondar para 2 casas:
   - `custo_total_receita` (ingredientes diretos)
   - `custo_total_receitas_reutilizaveis`
   - `custo_receita_ajustado` (após perda)
   - `custo_unitario_produto` (custo por unidade)
   - `custo_kit` e `custo_kit_total` (kit × rendimento — esse é o caso do bug)
   - `custo_mao_obra`
   - `preco_minimo` e `preco_sugerido` (depois aplicar o arredondamento de preço já existente, se configurado)
   - `lucro_unitario`, `lucro_teorico`, `lucro_unitario_real`, `diferenca_para_ideal`

## Resultado

8 kits de R$ 0,29 passam a somar exatamente R$ 2,32. Todos os totais exibidos passam a bater com a soma manual dos valores que aparecem na interface.

## Escopo

Apenas `src/store/usePricingStore.ts`. Sem alterações de UI, schema ou banco. Configuração de arredondamento de preço final (0,10 / 0,50 / 1,00) continua funcionando como está.