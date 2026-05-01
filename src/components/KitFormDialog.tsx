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
import { usePricingStore, custoTotalKit } from "@/store/usePricingStore";
import type { KitEmbalagem, Unidade } from "@/store/types";
import { brl } from "@/lib/format";
import { unidadeLabel, unidadesCompativeis, converterQuantidade } from "@/lib/units";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: KitEmbalagem | null;
}

interface ItemDraft {
  materia_prima_id: string;
  quantidade_utilizada: number;
  unidade_utilizada: Unidade | null;
}

const empty = { nome_kit: "", itens: [] as ItemDraft[] };

export function KitFormDialog({ open, onOpenChange, initial }: Props) {
  const materias = usePricingStore((s) => s.materias);
  const addKit = usePricingStore((s) => s.addKit);
  const updateKit = usePricingStore((s) => s.updateKit);

  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const embalagens = useMemo(
    () => materias.filter((m) => m.categoria === "embalagem"),
    [materias],
  );

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              nome_kit: initial.nome_kit,
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

  const total = useMemo(
    () =>
      custoTotalKit(
        {
          id: "draft",
          nome_kit: form.nome_kit,
          itens: form.itens.map((i, idx) => ({ ...i, id: String(idx) })),
        },
        materias,
      ),
    [form, materias],
  );

  const submit = async () => {
    if (!form.nome_kit.trim()) return toast.error("Informe o nome do kit.");
    if (form.itens.length === 0) return toast.error("Adicione ao menos um item.");
    if (form.itens.some((i) => !i.materia_prima_id))
      return toast.error("Selecione a embalagem em todos os itens.");
    setBusy(true);
    try {
      const payload = { nome_kit: form.nome_kit.trim(), itens: form.itens };
      if (initial) {
        await updateKit(initial.id, payload);
        toast.success("Kit atualizado.");
      } else {
        await addKit(payload);
        toast.success("Kit criado.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  const addItem = () =>
    setForm((f) => ({
      ...f,
      itens: [
        ...f.itens,
        {
          materia_prima_id: embalagens[0]?.id ?? "",
          quantidade_utilizada: 1,
          unidade_utilizada: embalagens[0]?.unidade_medida ?? null,
        },
      ],
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar kit" : "Novo kit de embalagem"}
          </DialogTitle>
          <DialogDescription>
            Agrupe embalagens reutilizáveis para usar nos produtos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nome_kit">Nome do kit</Label>
            <Input
              id="nome_kit"
              autoFocus
              value={form.nome_kit}
              onChange={(e) => setForm({ ...form, nome_kit: e.target.value })}
              placeholder="Ex.: Embalagem pão de mel"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Itens do kit</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                disabled={embalagens.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>

            {embalagens.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Cadastre matérias-primas da categoria <strong>embalagem</strong> primeiro.
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
                        onValueChange={(v) => {
                          const novoMp = embalagens.find((x) => x.id === v);
                          setForm((f) => ({
                            ...f,
                            itens: f.itens.map((it, i) =>
                              i === idx
                                ? {
                                    ...it,
                                    materia_prima_id: v,
                                    unidade_utilizada: novoMp?.unidade_medida ?? null,
                                  }
                                : it,
                            ),
                          }));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {embalagens.map((mp) => (
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
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            itens: f.itens.map((it, i) =>
                              i === idx ? { ...it, quantidade_utilizada: v } : it,
                            ),
                          }))
                        }
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

          <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Custo total do kit</span>
            <span className="font-display text-xl font-semibold tabular-nums text-primary">
              {brl(total)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Salvando..." : initial ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
