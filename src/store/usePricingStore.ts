import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { converterQuantidade } from "@/lib/units";
import type {
  CategoriaProduto,
  Configuracoes,
  GastoMensal,
  ItemReceita,
  KitEmbalagem,
  KitItem,
  MateriaPrima,
  ModoCustoFixo,
  Produto,
  ProdutoReceita,
  Receita,
  ReceitaItem,
  TipoArredondamento,
} from "./types";

interface State {
  loaded: boolean;
  loading: boolean;
  materias: MateriaPrima[];
  kits: KitEmbalagem[];
  produtos: Produto[];
  receitas: Receita[];
  categorias: CategoriaProduto[];
  config: Configuracoes;
  gastos: GastoMensal[];

  // gastos
  addGasto: (g: Omit<GastoMensal, "id">) => Promise<void>;
  updateGasto: (id: string, g: Omit<GastoMensal, "id">) => Promise<void>;
  deleteGasto: (id: string) => Promise<void>;

  loadAll: () => Promise<void>;
  reset: () => void;

  // matérias
  addMateria: (m: Omit<MateriaPrima, "id">) => Promise<void>;
  updateMateria: (id: string, m: Omit<MateriaPrima, "id">) => Promise<void>;
  deleteMateria: (id: string) => Promise<void>;

  // kits
  addKit: (k: Omit<KitEmbalagem, "id" | "itens"> & { itens: Omit<KitItem, "id">[] }) => Promise<void>;
  updateKit: (id: string, k: Omit<KitEmbalagem, "id" | "itens"> & { itens: Omit<KitItem, "id">[] }) => Promise<void>;
  deleteKit: (id: string) => Promise<void>;
  duplicateKit: (id: string) => Promise<void>;

  // receitas
  addReceita: (r: Omit<Receita, "id" | "itens"> & { itens: Omit<ReceitaItem, "id">[] }) => Promise<void>;
  updateReceita: (id: string, r: Omit<Receita, "id" | "itens"> & { itens: Omit<ReceitaItem, "id">[] }) => Promise<void>;
  deleteReceita: (id: string) => Promise<void>;
  duplicateReceita: (id: string) => Promise<void>;

  // produtos
  addProduto: (p: Omit<Produto, "id" | "itens" | "receitas"> & { itens: Omit<ItemReceita, "id">[]; receitas?: Omit<ProdutoReceita, "id">[] }) => Promise<void>;
  updateProduto: (id: string, p: Omit<Produto, "id" | "itens" | "receitas"> & { itens: Omit<ItemReceita, "id">[]; receitas?: Omit<ProdutoReceita, "id">[] }) => Promise<void>;
  deleteProduto: (id: string) => Promise<void>;
  duplicateProduto: (id: string) => Promise<void>;

  // categorias
  addCategoria: (c: Omit<CategoriaProduto, "id" | "is_default" | "ordem_exibicao"> & { ordem_exibicao?: number }) => Promise<CategoriaProduto>;
  updateCategoria: (id: string, c: Partial<Omit<CategoriaProduto, "id" | "is_default">>) => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
  reorderCategorias: (ids: string[]) => Promise<void>;

  // config
  updateConfig: (c: Configuracoes) => Promise<void>;

  // io
  importAll: (data: {
    materias: MateriaPrima[];
    kits?: KitEmbalagem[];
    produtos: Produto[];
    config: Configuracoes;
  }) => Promise<void>;
  exportAll: () => {
    materias: MateriaPrima[];
    kits: KitEmbalagem[];
    produtos: Produto[];
    config: Configuracoes;
  };
}

const DEFAULT_CONFIG: Configuracoes = {
  percentual_custo_fixo: 19,
  percentual_lucro: 20,
  valor_hora_trabalho: 0,
  tipo_arredondamento_preco: "nenhum",
  modo_custo_fixo: "manual",
  faturamento_mensal_estimado: 0,
};

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");
  return data.user.id;
}

export const usePricingStore = create<State>()((set, get) => ({
  loaded: false,
  loading: false,
  materias: [],
  kits: [],
  produtos: [],
  receitas: [],
  categorias: [],
  config: DEFAULT_CONFIG,
  gastos: [],

  reset: () =>
    set({ loaded: false, materias: [], kits: [], produtos: [], receitas: [], categorias: [], config: DEFAULT_CONFIG, gastos: [] }),

  loadAll: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      // Tabelas de receitas ainda não estão tipadas no types.ts gerado.
      // Usamos um cast permissivo só para essas três queries.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [matRes, kitsRes, kitItensRes, prodRes, prodItensRes, cfgRes, catRes, recRes, recItensRes, prodRecRes, gastosRes] =
        await Promise.all([
          supabase.from("materias_primas").select("*").order("nome"),
          supabase.from("kits_embalagem").select("*").order("nome_kit"),
          supabase.from("kit_itens").select("*"),
          supabase.from("produtos").select("*").order("nome_produto"),
          supabase.from("produto_itens").select("*"),
          supabase.from("configuracoes").select("*").maybeSingle(),
          supabase.from("categorias_produto").select("*").order("ordem_exibicao"),
          sb.from("receitas").select("*").order("nome_receita"),
          sb.from("receita_itens").select("*"),
          sb.from("produto_receitas").select("*"),
          sb.from("gastos_mensais").select("*").order("nome_gasto"),
        ]);

      const materias: MateriaPrima[] = (matRes.data ?? []).map((r) => ({
        id: r.id,
        nome: r.nome,
        valor_embalagem: Number(r.valor_embalagem),
        quantidade_embalagem: Number(r.quantidade_embalagem),
        unidade_medida: r.unidade_medida,
        categoria: r.categoria,
      }));

      const kitItensByKit = new Map<string, KitItem[]>();
      (kitItensRes.data ?? []).forEach((r) => {
        const arr = kitItensByKit.get(r.kit_id) ?? [];
        arr.push({
          id: r.id,
          materia_prima_id: r.materia_prima_id,
          quantidade_utilizada: Number(r.quantidade_utilizada),
          unidade_utilizada: (r as { unidade_utilizada?: KitItem["unidade_utilizada"] }).unidade_utilizada ?? null,
        });
        kitItensByKit.set(r.kit_id, arr);
      });

      const kits: KitEmbalagem[] = (kitsRes.data ?? []).map((r) => ({
        id: r.id,
        nome_kit: r.nome_kit,
        itens: kitItensByKit.get(r.id) ?? [],
      }));

      const prodItensByProd = new Map<string, ItemReceita[]>();
      (prodItensRes.data ?? []).forEach((r) => {
        const arr = prodItensByProd.get(r.produto_id) ?? [];
        arr.push({
          id: r.id,
          materia_prima_id: r.materia_prima_id,
          quantidade_utilizada: Number(r.quantidade_utilizada),
          unidade_utilizada: (r as { unidade_utilizada?: ItemReceita["unidade_utilizada"] }).unidade_utilizada ?? null,
        });
        prodItensByProd.set(r.produto_id, arr);
      });

      const prodReceitasByProd = new Map<string, ProdutoReceita[]>();
      ((prodRecRes?.data as Array<Record<string, unknown>> | null) ?? []).forEach((r) => {
        const produto_id = String(r.produto_id);
        const arr = prodReceitasByProd.get(produto_id) ?? [];
        arr.push({
          id: String(r.id),
          receita_id: String(r.receita_id),
          quantidade_utilizada: Number(r.quantidade_utilizada),
        });
        prodReceitasByProd.set(produto_id, arr);
      });

      const produtos: Produto[] = (prodRes.data ?? []).map((r) => ({
        id: r.id,
        nome_produto: r.nome_produto,
        rendimento: Number(r.rendimento),
        percentual_perda: Number(r.percentual_perda),
        tempo_producao_minutos: Number(r.tempo_producao_minutos ?? 0),
        preco_praticado: r.preco_praticado != null ? Number(r.preco_praticado) : null,
        kit_embalagem_id: r.kit_embalagem_id ?? null,
        categoria_id: (r as { categoria_id?: string | null }).categoria_id ?? null,
        itens: prodItensByProd.get(r.id) ?? [],
        receitas: prodReceitasByProd.get(r.id) ?? [],
      }));

      const categorias: CategoriaProduto[] = (catRes.data ?? []).map((r) => ({
        id: r.id,
        nome_categoria: r.nome_categoria,
        cor: r.cor,
        ordem_exibicao: Number(r.ordem_exibicao),
        ativa: r.ativa,
        is_default: r.is_default,
      }));

      // ===== Receitas =====
      const recItensByRec = new Map<string, ReceitaItem[]>();
      ((recItensRes?.data as Array<Record<string, unknown>> | null) ?? []).forEach((r) => {
        const receita_id = String(r.receita_id);
        const arr = recItensByRec.get(receita_id) ?? [];
        arr.push({
          id: String(r.id),
          materia_prima_id: String(r.materia_prima_id),
          quantidade_utilizada: Number(r.quantidade_utilizada),
          unidade_utilizada: (r.unidade_utilizada as ReceitaItem["unidade_utilizada"]) ?? null,
        });
        recItensByRec.set(receita_id, arr);
      });

      const receitas: Receita[] = ((recRes?.data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
        id: String(r.id),
        nome_receita: String(r.nome_receita),
        rendimento: Number(r.rendimento),
        unidade_rendimento: (r.unidade_rendimento as Receita["unidade_rendimento"]) ?? "g",
        itens: recItensByRec.get(String(r.id)) ?? [],
      }));

      const cfgRow = cfgRes.data as Record<string, unknown> | null;
      const config: Configuracoes = cfgRow
        ? {
            percentual_custo_fixo: Number(cfgRow.percentual_custo_fixo),
            percentual_lucro: Number(cfgRow.percentual_lucro),
            valor_hora_trabalho: Number(cfgRow.valor_hora_trabalho),
            tipo_arredondamento_preco: cfgRow.tipo_arredondamento_preco as TipoArredondamento,
            modo_custo_fixo: ((cfgRow.modo_custo_fixo as ModoCustoFixo | undefined) ?? "manual"),
            faturamento_mensal_estimado: Number(cfgRow.faturamento_mensal_estimado ?? 0),
          }
        : DEFAULT_CONFIG;

      const gastos: GastoMensal[] = ((gastosRes?.data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
        id: String(r.id),
        nome_gasto: String(r.nome_gasto),
        valor_mensal: Number(r.valor_mensal),
      }));

      set({ materias, kits, produtos, receitas, categorias, config, gastos, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  addMateria: async (m) => {
    const user_id = await getUserId();
    const { data, error } = await supabase
      .from("materias_primas")
      .insert({ ...m, user_id })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({
      materias: [...s.materias, {
        id: data.id, nome: data.nome,
        valor_embalagem: Number(data.valor_embalagem),
        quantidade_embalagem: Number(data.quantidade_embalagem),
        unidade_medida: data.unidade_medida, categoria: data.categoria,
      }].sort((a, b) => a.nome.localeCompare(b.nome)),
    }));
  },
  updateMateria: async (id, m) => {
    const { error } = await supabase.from("materias_primas").update(m).eq("id", id);
    if (error) throw error;
    set((s) => ({
      materias: s.materias.map((x) => (x.id === id ? { ...m, id } : x)),
    }));
  },
  deleteMateria: async (id) => {
    const { error } = await supabase.from("materias_primas").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      materias: s.materias.filter((x) => x.id !== id),
      produtos: s.produtos.map((p) => ({
        ...p,
        itens: p.itens.filter((i) => i.materia_prima_id !== id),
      })),
      kits: s.kits.map((k) => ({
        ...k,
        itens: k.itens.filter((i) => i.materia_prima_id !== id),
      })),
    }));
  },

  addKit: async (k) => {
    const user_id = await getUserId();
    const { data, error } = await supabase
      .from("kits_embalagem")
      .insert({ nome_kit: k.nome_kit, user_id })
      .select()
      .single();
    if (error) throw error;
    if (k.itens.length > 0) {
      const { error: e2 } = await supabase.from("kit_itens").insert(
        k.itens.map((i) => ({ ...i, kit_id: data.id })),
      );
      if (e2) throw e2;
    }
    await get().loadAll();
  },
  updateKit: async (id, k) => {
    const { error } = await supabase.from("kits_embalagem").update({ nome_kit: k.nome_kit }).eq("id", id);
    if (error) throw error;
    await supabase.from("kit_itens").delete().eq("kit_id", id);
    if (k.itens.length > 0) {
      await supabase.from("kit_itens").insert(k.itens.map((i) => ({ ...i, kit_id: id })));
    }
    await get().loadAll();
  },
  deleteKit: async (id) => {
    const { error } = await supabase.from("kits_embalagem").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      kits: s.kits.filter((k) => k.id !== id),
      produtos: s.produtos.map((p) =>
        p.kit_embalagem_id === id ? { ...p, kit_embalagem_id: null } : p,
      ),
    }));
  },
  duplicateKit: async (id) => {
    const orig = get().kits.find((k) => k.id === id);
    if (!orig) return;
    await get().addKit({
      nome_kit: `${orig.nome_kit} (cópia)`,
      itens: orig.itens.map((i) => ({
        materia_prima_id: i.materia_prima_id,
        quantidade_utilizada: i.quantidade_utilizada,
        unidade_utilizada: i.unidade_utilizada ?? null,
      })),
    });
  },

  addProduto: async (p) => {
    const user_id = await getUserId();
    const { data, error } = await supabase
      .from("produtos")
      .insert({
        user_id,
        nome_produto: p.nome_produto,
        rendimento: p.rendimento,
        percentual_perda: p.percentual_perda,
        tempo_producao_minutos: p.tempo_producao_minutos,
        preco_praticado: p.preco_praticado ?? null,
        kit_embalagem_id: p.kit_embalagem_id ?? null,
        categoria_id: p.categoria_id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    if (p.itens.length > 0) {
      const { error: e2 } = await supabase.from("produto_itens").insert(
        p.itens.map((i) => ({ ...i, produto_id: data.id })),
      );
      if (e2) throw e2;
    }
    if (p.receitas && p.receitas.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { error: e3 } = await sb.from("produto_receitas").insert(
        p.receitas.map((r) => ({
          produto_id: data.id,
          receita_id: r.receita_id,
          quantidade_utilizada: r.quantidade_utilizada,
        })),
      );
      if (e3) throw e3;
    }
    await get().loadAll();
  },
  updateProduto: async (id, p) => {
    const { error } = await supabase
      .from("produtos")
      .update({
        nome_produto: p.nome_produto,
        rendimento: p.rendimento,
        percentual_perda: p.percentual_perda,
        tempo_producao_minutos: p.tempo_producao_minutos,
        preco_praticado: p.preco_praticado ?? null,
        kit_embalagem_id: p.kit_embalagem_id ?? null,
        categoria_id: p.categoria_id ?? null,
      })
      .eq("id", id);
    if (error) throw error;
    await supabase.from("produto_itens").delete().eq("produto_id", id);
    if (p.itens.length > 0) {
      await supabase.from("produto_itens").insert(p.itens.map((i) => ({ ...i, produto_id: id })));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    await sb.from("produto_receitas").delete().eq("produto_id", id);
    if (p.receitas && p.receitas.length > 0) {
      await sb.from("produto_receitas").insert(
        p.receitas.map((r) => ({
          produto_id: id,
          receita_id: r.receita_id,
          quantidade_utilizada: r.quantidade_utilizada,
        })),
      );
    }
    await get().loadAll();
  },
  deleteProduto: async (id) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ produtos: s.produtos.filter((x) => x.id !== id) }));
  },
  duplicateProduto: async (id) => {
    const orig = get().produtos.find((p) => p.id === id);
    if (!orig) return;
    await get().addProduto({
      nome_produto: `${orig.nome_produto} (cópia)`,
      rendimento: orig.rendimento,
      percentual_perda: orig.percentual_perda,
      tempo_producao_minutos: orig.tempo_producao_minutos,
      preco_praticado: orig.preco_praticado ?? null,
      kit_embalagem_id: orig.kit_embalagem_id ?? null,
      categoria_id: orig.categoria_id ?? null,
      itens: orig.itens.map((i) => ({
        materia_prima_id: i.materia_prima_id,
        quantidade_utilizada: i.quantidade_utilizada,
        unidade_utilizada: i.unidade_utilizada ?? null,
      })),
      receitas: (orig.receitas ?? []).map((r) => ({
        receita_id: r.receita_id,
        quantidade_utilizada: r.quantidade_utilizada,
      })),
    });
  },

  // ===== receitas =====
  addReceita: async (r) => {
    const user_id = await getUserId();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data, error } = await sb
      .from("receitas")
      .insert({
        user_id,
        nome_receita: r.nome_receita,
        rendimento: r.rendimento,
        unidade_rendimento: r.unidade_rendimento,
      })
      .select()
      .single();
    if (error) throw error;
    if (r.itens.length > 0) {
      const { error: e2 } = await sb.from("receita_itens").insert(
        r.itens.map((i) => ({ ...i, receita_id: data.id })),
      );
      if (e2) throw e2;
    }
    await get().loadAll();
  },
  updateReceita: async (id, r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = await sb
      .from("receitas")
      .update({
        nome_receita: r.nome_receita,
        rendimento: r.rendimento,
        unidade_rendimento: r.unidade_rendimento,
      })
      .eq("id", id);
    if (error) throw error;
    await sb.from("receita_itens").delete().eq("receita_id", id);
    if (r.itens.length > 0) {
      await sb.from("receita_itens").insert(r.itens.map((i: { materia_prima_id: string; quantidade_utilizada: number; unidade_utilizada?: string | null }) => ({ ...i, receita_id: id })));
    }
    await get().loadAll();
  },
  deleteReceita: async (id) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = await sb.from("receitas").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      receitas: s.receitas.filter((x) => x.id !== id),
      produtos: s.produtos.map((p) => ({
        ...p,
        receitas: (p.receitas ?? []).filter((pr) => pr.receita_id !== id),
      })),
    }));
  },
  duplicateReceita: async (id) => {
    const orig = get().receitas.find((r) => r.id === id);
    if (!orig) return;
    await get().addReceita({
      nome_receita: `${orig.nome_receita} (cópia)`,
      rendimento: orig.rendimento,
      unidade_rendimento: orig.unidade_rendimento,
      itens: orig.itens.map((i) => ({
        materia_prima_id: i.materia_prima_id,
        quantidade_utilizada: i.quantidade_utilizada,
        unidade_utilizada: i.unidade_utilizada ?? null,
      })),
    });
  },

  // ===== categorias =====
  addCategoria: async (c) => {
    const user_id = await getUserId();
    const ordem = c.ordem_exibicao ?? (get().categorias.reduce((m, x) => Math.max(m, x.ordem_exibicao), 0) + 1);
    const { data, error } = await supabase
      .from("categorias_produto")
      .insert({
        user_id,
        nome_categoria: c.nome_categoria,
        cor: c.cor,
        ativa: c.ativa,
        ordem_exibicao: ordem,
      })
      .select()
      .single();
    if (error) throw error;
    const novo: CategoriaProduto = {
      id: data.id,
      nome_categoria: data.nome_categoria,
      cor: data.cor,
      ordem_exibicao: Number(data.ordem_exibicao),
      ativa: data.ativa,
      is_default: data.is_default,
    };
    set((s) => ({ categorias: [...s.categorias, novo].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao) }));
    return novo;
  },
  updateCategoria: async (id, c) => {
    const { error } = await supabase.from("categorias_produto").update(c).eq("id", id);
    if (error) throw error;
    set((s) => ({
      categorias: s.categorias
        .map((x) => (x.id === id ? { ...x, ...c } : x))
        .sort((a, b) => a.ordem_exibicao - b.ordem_exibicao),
    }));
  },
  deleteCategoria: async (id) => {
    const cat = get().categorias.find((c) => c.id === id);
    if (!cat) return;
    if (cat.is_default) throw new Error("Não é possível excluir a categoria padrão.");
    const emUso = get().produtos.some((p) => p.categoria_id === id);
    if (emUso) throw new Error("Esta categoria possui produtos vinculados.");
    const { error } = await supabase.from("categorias_produto").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ categorias: s.categorias.filter((x) => x.id !== id) }));
  },
  reorderCategorias: async (ids) => {
    const updates = ids.map((id, idx) =>
      supabase.from("categorias_produto").update({ ordem_exibicao: idx }).eq("id", id),
    );
    await Promise.all(updates);
    set((s) => ({
      categorias: s.categorias
        .map((c) => ({ ...c, ordem_exibicao: ids.indexOf(c.id) >= 0 ? ids.indexOf(c.id) : c.ordem_exibicao }))
        .sort((a, b) => a.ordem_exibicao - b.ordem_exibicao),
    }));
  },

  // ===== gastos mensais =====
  addGasto: async (g) => {
    const user_id = await getUserId();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data, error } = await sb
      .from("gastos_mensais")
      .insert({ user_id, nome_gasto: g.nome_gasto, valor_mensal: g.valor_mensal })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({
      gastos: [
        ...s.gastos,
        { id: String(data.id), nome_gasto: String(data.nome_gasto), valor_mensal: Number(data.valor_mensal) },
      ].sort((a, b) => a.nome_gasto.localeCompare(b.nome_gasto)),
    }));
  },
  updateGasto: async (id, g) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = await sb
      .from("gastos_mensais")
      .update({ nome_gasto: g.nome_gasto, valor_mensal: g.valor_mensal })
      .eq("id", id);
    if (error) throw error;
    set((s) => ({
      gastos: s.gastos
        .map((x) => (x.id === id ? { ...g, id } : x))
        .sort((a, b) => a.nome_gasto.localeCompare(b.nome_gasto)),
    }));
  },
  deleteGasto: async (id) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = await sb.from("gastos_mensais").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ gastos: s.gastos.filter((x) => x.id !== id) }));
  },

  updateConfig: async (c) => {
    const user_id = await getUserId();
    const { error } = await supabase
      .from("configuracoes")
      .upsert({ user_id, ...c } as never, { onConflict: "user_id" });
    if (error) throw error;
    set({ config: c });
  },

  exportAll: () => {
    const s = get();
    return { materias: s.materias, kits: s.kits, produtos: s.produtos, config: s.config };
  },
  importAll: async (data) => {
    const user_id = await getUserId();
    // wipe (cascades will clean items)
    await supabase.from("produtos").delete().eq("user_id", user_id);
    await supabase.from("kits_embalagem").delete().eq("user_id", user_id);
    await supabase.from("materias_primas").delete().eq("user_id", user_id);

    // Map old IDs -> new IDs to preserve relations
    const matIdMap = new Map<string, string>();
    if (data.materias.length > 0) {
      const { data: inserted, error } = await supabase
        .from("materias_primas")
        .insert(
          data.materias.map((m) => ({
            user_id,
            nome: m.nome,
            valor_embalagem: m.valor_embalagem,
            quantidade_embalagem: m.quantidade_embalagem,
            unidade_medida: m.unidade_medida,
            categoria: m.categoria,
          })),
        )
        .select();
      if (error) throw error;
      data.materias.forEach((m, idx) => matIdMap.set(m.id, inserted[idx].id));
    }

    const kitIdMap = new Map<string, string>();
    const kits = data.kits ?? [];
    for (const k of kits) {
      const { data: kIns, error } = await supabase
        .from("kits_embalagem")
        .insert({ user_id, nome_kit: k.nome_kit })
        .select()
        .single();
      if (error) throw error;
      kitIdMap.set(k.id, kIns.id);
      const itens = k.itens
        .map((i) => ({
          kit_id: kIns.id,
          materia_prima_id: matIdMap.get(i.materia_prima_id) ?? "",
          quantidade_utilizada: i.quantidade_utilizada,
          unidade_utilizada: i.unidade_utilizada ?? null,
        }))
        .filter((i) => i.materia_prima_id);
      if (itens.length > 0) await supabase.from("kit_itens").insert(itens);
    }

    for (const p of data.produtos) {
      const { data: pIns, error } = await supabase
        .from("produtos")
        .insert({
          user_id,
          nome_produto: p.nome_produto,
          rendimento: p.rendimento,
          percentual_perda: p.percentual_perda,
          tempo_producao_minutos: p.tempo_producao_minutos ?? 0,
          preco_praticado: p.preco_praticado ?? null,
          kit_embalagem_id: p.kit_embalagem_id ? kitIdMap.get(p.kit_embalagem_id) ?? null : null,
        })
        .select()
        .single();
      if (error) throw error;
      const itens = p.itens
        .map((i) => ({
          produto_id: pIns.id,
          materia_prima_id: matIdMap.get(i.materia_prima_id) ?? "",
          quantidade_utilizada: i.quantidade_utilizada,
          unidade_utilizada: i.unidade_utilizada ?? null,
        }))
        .filter((i) => i.materia_prima_id);
      if (itens.length > 0) await supabase.from("produto_itens").insert(itens);
    }

    if (data.config) {
      await supabase
        .from("configuracoes")
        .upsert({ user_id, ...data.config } as never, { onConflict: "user_id" });
    }

    await get().loadAll();
  },
}));

// ============== CALCULATIONS ==============

/** Soma de todos os gastos mensais. */
export function gastosTotalMensal(gastos: GastoMensal[]): number {
  return gastos.reduce((s, g) => s + (Number(g.valor_mensal) || 0), 0);
}

/**
 * Calcula o percentual de custo fixo efetivo.
 * - Modo manual → usa o valor configurado.
 * - Modo automático → percentual = (total_gastos / faturamento_mensal_estimado) × 100.
 *   Se faturamento <= 0, mantém o percentual manual configurado.
 */
export function percentualCustoFixoEfetivo(
  config: Configuracoes,
  gastos: GastoMensal[],
): number {
  if (config.modo_custo_fixo !== "automatico") return config.percentual_custo_fixo;
  const faturamento = config.faturamento_mensal_estimado || 0;
  if (faturamento <= 0) return config.percentual_custo_fixo;
  return (gastosTotalMensal(gastos) / faturamento) * 100;
}

/** Devolve uma cópia da config com o percentual_custo_fixo já resolvido. */
export function configEfetiva(
  config: Configuracoes,
  gastos: GastoMensal[],
): Configuracoes {
  if (config.modo_custo_fixo !== "automatico") return config;
  return {
    ...config,
    percentual_custo_fixo: percentualCustoFixoEfetivo(config, gastos),
  };
}


export type InsightTipo = "abaixo" | "acima" | "ideal" | "sem_preco";

export interface ProdutoCalculos {
  custo_total_receita: number;
  custo_receita_ajustado: number;
  /** Custo de 1 unidade do kit. */
  custo_kit: number;
  /** Custo do kit multiplicado pelo rendimento (1 kit por unidade produzida). */
  custo_kit_total: number;
  custo_mao_obra: number;
  custo_unitario_produto: number;
  preco_minimo: number;
  preco_sugerido: number;
  /** Preço efetivo usado nos cálculos de lucro: preco_praticado se houver, senão preco_sugerido. */
  preco_efetivo: number;
  /** true se preco_praticado preenchido (>0). */
  usando_preco_real: boolean;
  /** Lucro unitário considerando o preço efetivo (preco_efetivo - preco_minimo). */
  lucro_unitario: number;
  /** Percentual sobre o preço mínimo. */
  percentual_lucro: number;
  /** Lucro teórico se vendido pelo preço sugerido. */
  lucro_teorico: number;
  /** Lucro real (apenas quando há preço praticado), senão null. */
  lucro_unitario_real: number | null;
  percentual_lucro_real: number | null;
  /** Diferença entre preço sugerido e preço praticado (sugerido - praticado). null se não houver praticado. */
  diferenca_para_ideal: number | null;
  insight: InsightTipo;
}

export function custoUnitarioBase(m: MateriaPrima): number {
  return m.quantidade_embalagem > 0 ? m.valor_embalagem / m.quantidade_embalagem : 0;
}

/**
 * Custo de um item da receita/kit considerando conversão de unidade.
 * Se o item foi cadastrado em uma unidade diferente da matéria-prima
 * (ex.: matéria em kg, uso em g), converte para a unidade base antes
 * de multiplicar pelo custo unitário.
 */
function custoItem(
  m: MateriaPrima,
  quantidade: number,
  unidadeUsada: MateriaPrima["unidade_medida"] | null | undefined,
): number {
  if (!m.quantidade_embalagem) return 0;
  const unidadeBase = m.unidade_medida;
  const unidade = unidadeUsada ?? unidadeBase;
  const qtdNaBase = converterQuantidade(quantidade, unidade, unidadeBase);
  return custoUnitarioBase(m) * qtdNaBase;
}

/** Arredonda para 2 casas decimais (HALF_UP). */
function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function custoTotalKit(kit: KitEmbalagem, materias: MateriaPrima[]): number {
  return round2(
    kit.itens.reduce((sum, item) => {
      const m = materias.find((x) => x.id === item.materia_prima_id);
      if (!m) return sum;
      return sum + custoItem(m, item.quantidade_utilizada, item.unidade_utilizada);
    }, 0),
  );
}

export function custoTotalReceita(receita: Receita, materias: MateriaPrima[]): number {
  return round2(
    receita.itens.reduce((sum, item) => {
      const m = materias.find((x) => x.id === item.materia_prima_id);
      if (!m) return sum;
      return sum + custoItem(m, item.quantidade_utilizada, item.unidade_utilizada);
    }, 0),
  );
}

export function custoUnitarioReceita(receita: Receita, materias: MateriaPrima[]): number {
  const total = custoTotalReceita(receita, materias);
  return receita.rendimento > 0 ? round2(total / receita.rendimento) : 0;
}

function arredondar(v: number, tipo: TipoArredondamento): number {
  if (!Number.isFinite(v)) return 0;
  switch (tipo) {
    case "0.10": return Math.ceil(v * 10) / 10;
    case "0.50": return Math.ceil(v * 2) / 2;
    case "1.00": return Math.ceil(v);
    default: return v;
  }
}

export function calcularProduto(
  produto: Produto,
  materias: MateriaPrima[],
  config: Configuracoes,
  kits: KitEmbalagem[] = [],
  receitas: Receita[] = [],
): ProdutoCalculos {
  const custo_total_receita = produto.itens.reduce((sum, item) => {
    const m = materias.find((x) => x.id === item.materia_prima_id);
    if (!m) return sum;
    return sum + custoItem(m, item.quantidade_utilizada, item.unidade_utilizada);
  }, 0);

  // Custo das receitas reutilizáveis usadas no produto
  const custo_total_receitas_reutilizaveis = (produto.receitas ?? []).reduce((sum, pr) => {
    const r = receitas.find((x) => x.id === pr.receita_id);
    if (!r) return sum;
    // quantidade_utilizada agora representa a quantidade na unidade do rendimento da receita (ex: gramas)
    return sum + custoUnitarioReceita(r, materias) * (pr.quantidade_utilizada || 0);
  }, 0);

  const custo_total_combinado = custo_total_receita + custo_total_receitas_reutilizaveis;

  const custo_receita_ajustado =
    custo_total_combinado * (1 + (produto.percentual_perda || 0) / 100);

  let custo_unitario_produto =
    produto.rendimento > 0 ? custo_receita_ajustado / produto.rendimento : 0;

  // Kit (1 kit por unidade produzida)
  const kit = produto.kit_embalagem_id
    ? kits.find((k) => k.id === produto.kit_embalagem_id)
    : null;
  const custo_kit = kit ? custoTotalKit(kit, materias) : 0;
  const custo_kit_total = custo_kit * (produto.rendimento || 0);
  custo_unitario_produto += custo_kit;

  // Mão de obra (por unidade do rendimento)
  const tempo = produto.tempo_producao_minutos || 0;
  const custo_mao_obra_total = (tempo / 60) * (config.valor_hora_trabalho || 0);
  const custo_mao_obra =
    produto.rendimento > 0 ? custo_mao_obra_total / produto.rendimento : 0;
  custo_unitario_produto += custo_mao_obra;

  let preco_minimo = custo_unitario_produto * (1 + config.percentual_custo_fixo / 100);
  let preco_sugerido =
    custo_unitario_produto *
    (1 + config.percentual_custo_fixo / 100 + config.percentual_lucro / 100);

  preco_minimo = arredondar(preco_minimo, config.tipo_arredondamento_preco);
  preco_sugerido = arredondar(preco_sugerido, config.tipo_arredondamento_preco);

  const usando_preco_real =
    produto.preco_praticado != null && produto.preco_praticado > 0;
  const preco_efetivo = usando_preco_real
    ? (produto.preco_praticado as number)
    : preco_sugerido;

  const lucro_unitario = preco_efetivo - preco_minimo;
  const percentual_lucro =
    preco_minimo > 0 ? (lucro_unitario / preco_minimo) * 100 : 0;
  const lucro_teorico = preco_sugerido - preco_minimo;

  let lucro_unitario_real: number | null = null;
  let percentual_lucro_real: number | null = null;
  let diferenca_para_ideal: number | null = null;
  let insight: InsightTipo = "sem_preco";

  if (usando_preco_real) {
    lucro_unitario_real = (produto.preco_praticado as number) - preco_minimo;
    percentual_lucro_real =
      preco_minimo > 0 ? (lucro_unitario_real / preco_minimo) * 100 : 0;
    diferenca_para_ideal = preco_sugerido - (produto.preco_praticado as number);
    if ((produto.preco_praticado as number) < preco_sugerido) insight = "abaixo";
    else if ((produto.preco_praticado as number) > preco_sugerido) insight = "acima";
    else insight = "ideal";
  }

  return {
    custo_total_receita: custo_total_combinado,
    custo_receita_ajustado,
    custo_kit,
    custo_kit_total,
    custo_mao_obra,
    custo_unitario_produto,
    preco_minimo,
    preco_sugerido,
    preco_efetivo,
    usando_preco_real,
    lucro_unitario,
    percentual_lucro,
    lucro_teorico,
    lucro_unitario_real,
    percentual_lucro_real,
    diferenca_para_ideal,
    insight,
  };
}

/**
 * Hook que devolve a config com o percentual de custo fixo já resolvido
 * (manual usa o valor configurado, automático calcula a partir dos gastos).
 */
export function useConfigEfetiva(): Configuracoes {
  const config = usePricingStore((s) => s.config);
  const gastos = usePricingStore((s) => s.gastos);
  if (config.modo_custo_fixo !== "automatico") return config;
  return configEfetiva(config, gastos);
}
