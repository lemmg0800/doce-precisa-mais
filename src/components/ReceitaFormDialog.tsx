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
import { NumberInput } from "@/components/inputs";
import { Plus, Trash2 } from "lucide-react";
import {
  usePricingStore,
  custoTotalReceita,
  custoUnitarioReceita,
} from "@/store/usePricingStore";
import type { Receita, Unidade } from "@/store/types";
import { brl } from "@/lib/format";
import { unidadeLabel, unidadesCompativeis, unidadePadraoReceita } from "@/lib/units";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Receita | null;
}

interface ItemDraft {
  materia_prima_id: string;
  quantidade_utilizada: number;
  unidade_utilizada: Unidade | null;
}

const empty = {
  nome_receita: "",
  rendimento: 1,
  unidade_rendimento: "g" as Unidade,
  itens: [] as ItemDraft[],
};

export function ReceitaFormDialog({ open, onOpenChange, initial }: Props) {
  const materias = usePricingStore((s) => s.materias);
  const addReceita = usePricingStore((s) => s.addReceita);
  const updateReceita = usePricingStore((s) => s.updateReceita);

  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [autoOpenIdx, setAutoOpenIdx] = useState<number | null>(null);
  const [focusQtdIdx, setFocusQtdIdx] = useState<number | null>(null);

  // Apenas ingredientes (regra: receitas não usam embalagens)
  const ingredientes = useMemo(
    () => materias.filter((m) => m.categoria === "ingrediente"),
    [materias],
  );

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              nome_receita: initial.nome_receita,
              rendimento: initial.rendimento,
              unidade_rendimento: initial.unidade_rendimento,
              itens: initial.itens.map((i) => ({
                materia_prima_id: i.materia_prima_id,
                quantidade_utilizada: i.quantidade_utilizada,
                unidade_utilizada: i.unidade_utilizada ?? null,
              })),
            }
          : empty,
      );
    }
  }, [open, initial]);

  const draft: Receita = useMemo(
    () => ({
      id: "draft",
      nome_receita: form.nome_receita,
      rendimento: form.rendimento,
      unidade_rendimento: form.unidade_rendimento,
      itens: form.itens.map((i, idx) => ({ ...i, id: String(idx) })),
    }),
    [form],
  );

  const total = custoTotalReceita(draft, materias);
  const unit = custoUnitarioReceita(draft, materias);

  const submit = async () => {
    if (!form.nome_receita.trim()) return toast.error("Informe o nome da receita.");
    if (!form.rendimento || form.rendimento <= 0)
      return toast.error("Rendimento deve ser maior que zero.");
    if (form.itens.length === 0) return toast.error("Adicione ao menos um ingrediente.");
    if (form.itens.some((i) => !i.materia_prima_id))
      return toast.error("Selecione o ingrediente em todos os itens.");
    setBusy(true);
    try {
      const payload = {
        nome_receita: form.nome_receita.trim(),
        rendimento: form.rendimento,
        unidade_rendimento: form.unidade_rendimento,
        itens: form.itens,
      };
      if (initial) {
        await updateReceita(initial.id, payload);
        toast.success("Receita atualizada.");
      } else {
        await addReceita(payload);
        toast.success("Receita criada.");
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
      setTimeout(() => setAutoOpenIdx(newIdx), 0);
      return {
        ...f,
        itens: [
          ...f.itens,
          { materia_prima_id: "", quantidade_utilizada: 0, unidade_utilizada: null },
        ],
      };
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar receita" : "Nova receita"}
          </DialogTitle>
          <DialogDescription>
            Preparos reutilizáveis (ex.: massa, recheio). Apenas ingredientes — embalagens vão em kits.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nome_receita">Nome da receita</Label>
            <Input
              id="nome_receita"
              autoFocus
              value={form.nome_receita}
              onChange={(e) => setForm({ ...form, nome_receita: e.target.value })}
              placeholder="Ex.: Massa de pão de mel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Rendimento</Label>
              <NumberInput
                value={form.rendimento}
                onChange={(v) => setForm({ ...form, rendimento: v })}
                min={0}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label>Unidade do rendimento</Label>
              <Select
                value={form.unidade_rendimento}
                onValueChange={(v) =>
                  setForm({ ...form, unidade_rendimento: v as Unidade })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="unidade">un</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredientes</Label>
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
                Cadastre ingredientes em &quot;Ingredientes e Embalagens&quot; antes de criar receitas.
              </p>
            )}

            <div className="space-y-2">
              {form.itens.map((item, idx) => {
                const m = materias.find((x) => x.id === item.materia_prima_id);
                const unidadeBase = m?.unidade_medida;
                const unidadeAtual = item.unidade_utilizada ?? unidadeBase ?? null;
                const opcoesUnidade = unidadeBase ? unidadesCompativeis(unidadeBase) : [];
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg bg-secondary/40"
                  >
                    <div className="col-span-12 sm:col-span-6">
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
                    <div className="col-span-6 sm:col-span-2">
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
                    <div className="col-span-5 sm:col-span-3">
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

          <div className="rounded-xl border bg-card p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Custo total</div>
              <div className="font-display text-xl font-semibold tabular-nums">{brl(total)}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs">
                Custo por {unidadeLabel(form.unidade_rendimento)}
              </div>
              <div className="font-display text-xl font-semibold tabular-nums text-primary">
                {brl(unit)}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Salvando..." : initial ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
