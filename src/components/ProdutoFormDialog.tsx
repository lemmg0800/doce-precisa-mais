import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CurrencyInput, NumberInput } from "@/components/inputs";
import { Plus, Trash2, Settings2, BookOpen } from "lucide-react";
import { usePricingStore, calcularProduto, custoUnitarioReceita } from "@/store/usePricingStore";
import type { Produto, Unidade } from "@/store/types";
import { brl, pct } from "@/lib/format";
import { unidadeLabel, unidadesCompativeis, converterQuantidade, unidadePadraoReceita } from "@/lib/units";
import { CategoriasManagerDialog } from "@/components/CategoriasManagerDialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Produto | null;
}

interface ItemDraft {
  materia_prima_id: string;
  quantidade_utilizada: number;
  unidade_utilizada: Unidade | null;
}

interface ReceitaDraft {
  receita_id: string;
  quantidade_utilizada: number;
}

const empty = {
  nome_produto: "",
  rendimento: 1,
  percentual_perda: 0,
  tempo_producao_minutos: 0,
  preco_praticado: null as number | null,
  kit_embalagem_id: null as string | null,
  categoria_id: null as string | null,
  itens: [] as ItemDraft[],
  receitas: [] as ReceitaDraft[],
};

export function ProdutoFormDialog({ open, onOpenChange, initial }: Props) {
  const materias = usePricingStore((s) => s.materias);
  const kits = usePricingStore((s) => s.kits);
  const receitasAll = usePricingStore((s) => s.receitas);
  const categorias = usePricingStore((s) => s.categorias);
  const config = usePricingStore((s) => s.config);
  const addProduto = usePricingStore((s) => s.addProduto);
  const updateProduto = usePricingStore((s) => s.updateProduto);

  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [autoOpenIdx, setAutoOpenIdx] = useState<number | null>(null);
  const [focusQtdIdx, setFocusQtdIdx] = useState<number | null>(null);
  const [autoOpenRecIdx, setAutoOpenRecIdx] = useState<number | null>(null);

  const categoriasAtivas = useMemo(
    () => [...categorias].filter((c) => c.ativa).sort((a, b) => a.ordem_exibicao - b.ordem_exibicao),
    [categorias],
  );

  // Apenas matérias do tipo ingrediente para a receita
  const ingredientes = useMemo(
    () => materias.filter((m) => m.categoria === "ingrediente"),
    [materias],
  );

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              nome_produto: initial.nome_produto,
              rendimento: initial.rendimento,
              percentual_perda: initial.percentual_perda,
              tempo_producao_minutos: initial.tempo_producao_minutos ?? 0,
              preco_praticado: initial.preco_praticado ?? null,
              kit_embalagem_id: initial.kit_embalagem_id ?? null,
              categoria_id: initial.categoria_id ?? null,
              itens: initial.itens.map((i) => ({
                materia_prima_id: i.materia_prima_id,
                quantidade_utilizada: i.quantidade_utilizada,
                unidade_utilizada: i.unidade_utilizada ?? null,
              })),
              receitas: (initial.receitas ?? []).map((r) => ({
                receita_id: r.receita_id,
                quantidade_utilizada: r.quantidade_utilizada,
              })),
            }
          : empty,
      );
    }
  }, [open, initial]);

  const calc = useMemo(
    () =>
      calcularProduto(
        {
          id: "draft",
          nome_produto: form.nome_produto,
          rendimento: form.rendimento,
          percentual_perda: form.percentual_perda,
          tempo_producao_minutos: form.tempo_producao_minutos,
          preco_praticado: form.preco_praticado ?? undefined,
          kit_embalagem_id: form.kit_embalagem_id,
          itens: form.itens.map((i, idx) => ({ ...i, id: String(idx) })),
          receitas: form.receitas.map((r, idx) => ({ ...r, id: String(idx) })),
        },
        materias,
        config,
        kits,
        receitasAll,
      ),
    [form, materias, config, kits, receitasAll],
  );

  const submit = async () => {
    if (!form.nome_produto.trim()) return toast.error("Informe o nome do produto.");
    if (!form.rendimento || form.rendimento <= 0)
      return toast.error("Rendimento deve ser maior que zero.");
    if (form.itens.length === 0 && form.receitas.length === 0)
      return toast.error("Adicione ao menos uma matéria-prima ou receita.");
    if (form.itens.some((i) => !i.materia_prima_id))
      return toast.error("Selecione a matéria-prima em todos os itens.");
    if (form.receitas.some((r) => !r.receita_id))
      return toast.error("Selecione a receita em todos os itens.");
    if (form.receitas.some((r) => !r.quantidade_utilizada || r.quantidade_utilizada <= 0))
      return toast.error("Informe a quantidade utilizada para todas as receitas.");

    const payload = {
      nome_produto: form.nome_produto.trim(),
      rendimento: form.rendimento,
      percentual_perda: form.percentual_perda || 0,
      tempo_producao_minutos: form.tempo_producao_minutos || 0,
      preco_praticado: form.preco_praticado || null,
      kit_embalagem_id: form.kit_embalagem_id || null,
      categoria_id: form.categoria_id || null,
      itens: form.itens,
      receitas: form.receitas,
    };
    setBusy(true);
    try {
      if (initial) {
        await updateProduto(initial.id, payload);
        toast.success("Produto atualizado.");
      } else {
        await addProduto(payload);
        toast.success("Produto criado.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  const addItem = () =>
    setForm((f) => {
      const newIdx = f.itens.length;
      // open dropdown for the new row right after render
      setTimeout(() => setAutoOpenIdx(newIdx), 0);
      return {
        ...f,
        itens: [
          ...f.itens,
          {
            materia_prima_id: "",
            quantidade_utilizada: 0,
            unidade_utilizada: null,
          },
        ],
      };
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription>
            Custo, mão de obra, kit e preços recalculam em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome do produto</Label>
            <Input
              id="nome"
              autoFocus
              value={form.nome_produto}
              onChange={(e) => setForm({ ...form, nome_produto: e.target.value })}
              placeholder="Ex.: Brigadeiro"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Rendimento (un.)</Label>
              <NumberInput
                value={form.rendimento}
                onChange={(v) => setForm({ ...form, rendimento: v })}
                min={1}
                placeholder="20"
              />
            </div>
            <div className="grid gap-2">
              <Label>Perda</Label>
              <NumberInput
                value={form.percentual_perda}
                onChange={(v) => setForm({ ...form, percentual_perda: v })}
                suffix="%"
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tempo (min)</Label>
              <NumberInput
                value={form.tempo_producao_minutos}
                onChange={(v) => setForm({ ...form, tempo_producao_minutos: v })}
                suffix="min"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Categoria</Label>
            <div className="flex gap-2">
              <Select
                value={form.categoria_id ?? "__none"}
                onValueChange={(v) =>
                  setForm({ ...form, categoria_id: v === "__none" ? null : v })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sem categoria</SelectItem>
                  {categoriasAtivas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: c.cor }}
                        />
                        {c.nome_categoria}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCategoriasOpen(true)}
                title="Editar categorias"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Kit de embalagem (opcional)</Label>
            <Select
              value={form.kit_embalagem_id ?? "__none"}
              onValueChange={(v) =>
                setForm({ ...form, kit_embalagem_id: v === "__none" ? null : v })
              }
            >
              <SelectTrigger><SelectValue placeholder="Sem kit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sem kit</SelectItem>
                {kits.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.nome_kit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kits.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Você ainda não cadastrou kits de embalagem.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Matérias-primas utilizadas</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                disabled={ingredientes.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>

            {ingredientes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Cadastre ingredientes antes de montar a receita.
              </p>
            )}

            <div className="space-y-2">
              {form.itens.map((item, idx) => {
                const m = materias.find((x) => x.id === item.materia_prima_id);
                const unidadeBase = m?.unidade_medida;
                const unidadeAtual = item.unidade_utilizada ?? unidadeBase ?? null;
                const opcoesUnidade = unidadeBase ? unidadesCompativeis(unidadeBase) : [];
                const custoBase =
                  m && m.quantidade_embalagem > 0 ? m.valor_embalagem / m.quantidade_embalagem : 0;
                const qtdNaBase =
                  m && unidadeAtual
                    ? converterQuantidade(item.quantidade_utilizada, unidadeAtual, m.unidade_medida)
                    : item.quantidade_utilizada;
                const subtotal = m ? custoBase * qtdNaBase : 0;
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg bg-secondary/40"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <Select
                        value={item.materia_prima_id}
                        open={autoOpenIdx === idx ? true : undefined}
                        onOpenChange={(o) => {
                          if (!o && autoOpenIdx === idx) setAutoOpenIdx(null);
                        }}
                        onValueChange={(v) => {
                          const novoMp = ingredientes.find((x) => x.id === v);
                          setForm((f) => ({
                            ...f,
                            itens: f.itens.map((it, i) =>
                              i === idx
                                ? {
                                    ...it,
                                    materia_prima_id: v,
                                    unidade_utilizada: novoMp
                                      ? unidadePadraoReceita(novoMp.unidade_medida)
                                      : null,
                                  }
                                : it,
                            ),
                          }));
                          setAutoOpenIdx(null);
                          setFocusQtdIdx(idx);
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {ingredientes.map((mp) => (
                            <SelectItem key={mp.id} value={mp.id}>
                              {mp.nome} ({unidadeLabel(mp.unidade_medida)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5 sm:col-span-2">
                      <NumberInput
                        value={item.quantidade_utilizada}
                        autoFocus={focusQtdIdx === idx}
                        onChange={(v) => {
                          if (focusQtdIdx === idx) setFocusQtdIdx(null);
                          setForm((f) => ({
                            ...f,
                            itens: f.itens.map((it, i) =>
                              i === idx ? { ...it, quantidade_utilizada: v } : it,
                            ),
                          }));
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Select
                        value={unidadeAtual ?? ""}
                        disabled={!m || opcoesUnidade.length <= 1}
                        onValueChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            itens: f.itens.map((it, i) =>
                              i === idx ? { ...it, unidade_utilizada: v as Unidade } : it,
                            ),
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {opcoesUnidade.map((u) => (
                            <SelectItem key={u} value={u}>
                              {unidadeLabel(u)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right text-sm tabular-nums font-medium">
                      {brl(subtotal)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            itens: f.itens.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Receitas utilizadas
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm((f) => {
                    const newIdx = f.receitas.length;
                    setTimeout(() => setAutoOpenRecIdx(newIdx), 0);
                    return {
                      ...f,
                      receitas: [
                        ...f.receitas,
                        { receita_id: "", quantidade_utilizada: 1 },
                      ],
                    };
                  })
                }
                disabled={receitasAll.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar receita
              </Button>
            </div>

            {receitasAll.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Cadastre receitas em &quot;Receitas&quot; para reutilizá-las nos produtos.
              </p>
            )}

            <div className="space-y-2">
              {form.receitas.map((rec, idx) => {
                const r = receitasAll.find((x) => x.id === rec.receita_id);
                const custoUnit = r ? custoUnitarioReceita(r, materias) : 0;
                const custoTotalReceita = r
                  ? custoUnit * (r.rendimento || 0) * (rec.quantidade_utilizada || 0)
                  : 0;
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg bg-secondary/40"
                  >
                    <div className="col-span-12 sm:col-span-6">
                      <Select
                        value={rec.receita_id}
                        open={autoOpenRecIdx === idx ? true : undefined}
                        onOpenChange={(o) => {
                          if (!o && autoOpenRecIdx === idx) setAutoOpenRecIdx(null);
                        }}
                        onValueChange={(v) => {
                          setForm((f) => ({
                            ...f,
                            receitas: f.receitas.map((it, i) =>
                              i === idx ? { ...it, receita_id: v } : it,
                            ),
                          }));
                          setAutoOpenRecIdx(null);
                          setFocusQtdIdx(-(idx + 1));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar receita..." />
                        </SelectTrigger>
                        <SelectContent>
                          {receitasAll.map((rr) => (
                            <SelectItem key={rr.id} value={rr.id}>
                              {rr.nome_receita} — {brl(custoUnitarioReceita(rr, materias) * (rr.rendimento || 0))}/receita
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {r && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Custo da receita inteira: {brl(custoUnit * (r.rendimento || 0))}
                        </p>
                      )}
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <NumberInput
                        value={rec.quantidade_utilizada}
                        autoFocus={focusQtdIdx === -(idx + 1)}
                        min={0}
                        placeholder="1"
                        onChange={(v) => {
                          if (focusQtdIdx === -(idx + 1)) setFocusQtdIdx(null);
                          setForm((f) => ({
                            ...f,
                            receitas: f.receitas.map((it, i) =>
                              i === idx ? { ...it, quantidade_utilizada: v } : it,
                            ),
                          }));
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        receita(s)
                      </p>
                    </div>
                    <div className="col-span-6 sm:col-span-2 text-right text-sm tabular-nums font-medium">
                      {brl(custoTotalReceita)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            receitas: f.receitas.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <Row label="Custo total da receita" value={brl(calc.custo_total_receita)} />
              <Row label="Custo ajustado (perda)" value={brl(calc.custo_receita_ajustado)} />
              {calc.custo_kit > 0 && (
                <>
                  <Row label="Custo do kit (un.)" value={brl(calc.custo_kit)} />
                  <Row
                    label={`Custo total dos kits (× ${form.rendimento || 0})`}
                    value={brl(calc.custo_kit_total)}
                  />
                </>
              )}
              {calc.custo_mao_obra > 0 && (
                <Row label="Mão de obra (un.)" value={brl(calc.custo_mao_obra)} />
              )}
              <Row label="Custo unitário" value={brl(calc.custo_unitario_produto)} strong />
              <Row
                label={`Preço mínimo (+${pct(config.percentual_custo_fixo, 0)})`}
                value={brl(calc.preco_minimo)}
                strong
              />
              <Row
                label={`Preço sugerido (+${pct(
                  config.percentual_custo_fixo + config.percentual_lucro,
                  0,
                )})`}
                value={brl(calc.preco_sugerido)}
                strong
                accent
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Preço praticado (opcional)</Label>
            <CurrencyInput
              value={form.preco_praticado ?? 0}
              onChange={(v) => setForm({ ...form, preco_praticado: v || null })}
            />
            {form.preco_praticado != null &&
              form.preco_praticado > 0 &&
              calc.lucro_unitario_real != null && (
                <p
                  className={
                    "text-xs " +
                    (calc.lucro_unitario_real >= 0 ? "text-success" : "text-destructive")
                  }
                >
                  Lucro real por unidade: {brl(calc.lucro_unitario_real)} (
                  {pct(calc.percentual_lucro_real ?? 0)})
                </p>
              )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Salvando..." : initial ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <CategoriasManagerDialog
        open={categoriasOpen}
        onOpenChange={setCategoriasOpen}
        onCreated={(c) => setForm((f) => ({ ...f, categoria_id: c.id }))}
      />
    </Dialog>
  );
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <>
      <div className="text-muted-foreground">{label}</div>
      <div
        className={
          "text-right tabular-nums " +
          (accent ? "font-display text-base font-semibold text-primary " : "") +
          (strong && !accent ? "font-semibold " : "")
        }
      >
        {value}
      </div>
    </>
  );
}
