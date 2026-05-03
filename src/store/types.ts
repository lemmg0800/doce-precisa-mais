export type Unidade = "g" | "kg" | "ml" | "L" | "unidade";
export type Categoria = "ingrediente" | "embalagem";
export type TipoArredondamento = "nenhum" | "0.10" | "0.50" | "1.00";

export interface MateriaPrima {
  id: string;
  nome: string;
  valor_embalagem: number;
  quantidade_embalagem: number;
  unidade_medida: Unidade;
  categoria: Categoria;
}

export interface ItemReceita {
  id: string;
  materia_prima_id: string;
  quantidade_utilizada: number;
  unidade_utilizada?: Unidade | null;
}

export interface KitItem {
  id: string;
  materia_prima_id: string;
  quantidade_utilizada: number;
  unidade_utilizada?: Unidade | null;
}

export interface KitEmbalagem {
  id: string;
  nome_kit: string;
  itens: KitItem[];
}

export interface Produto {
  id: string;
  nome_produto: string;
  rendimento: number;
  percentual_perda: number;
  tempo_producao_minutos: number;
  preco_praticado?: number | null;
  kit_embalagem_id?: string | null;
  categoria_id?: string | null;
  itens: ItemReceita[];
  receitas?: ProdutoReceita[];
}

export interface CategoriaProduto {
  id: string;
  nome_categoria: string;
  cor: string;
  ordem_exibicao: number;
  ativa: boolean;
  is_default: boolean;
}

export interface ReceitaItem {
  id: string;
  materia_prima_id: string;
  quantidade_utilizada: number;
  unidade_utilizada?: Unidade | null;
}

export interface Receita {
  id: string;
  nome_receita: string;
  rendimento: number;
  unidade_rendimento: Unidade;
  itens: ReceitaItem[];
}

export interface ProdutoReceita {
  id: string;
  receita_id: string;
  quantidade_utilizada: number;
}

export type ModoCustoFixo = "manual" | "automatico";

export interface GastoMensal {
  id: string;
  nome_gasto: string;
  valor_mensal: number;
}

export interface Configuracoes {
  percentual_custo_fixo: number;
  percentual_lucro: number;
  valor_hora_trabalho: number;
  tipo_arredondamento_preco: TipoArredondamento;
  modo_custo_fixo: ModoCustoFixo;
  faturamento_mensal_estimado: number;
}

