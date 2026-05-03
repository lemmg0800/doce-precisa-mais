import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CurrencyInput, NumberInput } from "@/components/inputs";
import { usePricingStore } from "@/store/usePricingStore";
import type { Categoria, MateriaPrima, Unidade } from "@/store/types";
import { unidadeLabel } from "@/lib/units";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: MateriaPrima | null;
}

const empty = {
  nome: "",
  valor_embalagem: 0,
  quantidade_embalagem: 0,
  unidade_medida: "g" as Unidade,
  categoria: "ingrediente" as Categoria,
};

export function MateriaFormDialog({ open, onOpenChange, initial }: Props) {
  const addMateria = usePricingStore((s) => s.addMateria);
  const updateMateria = usePricingStore((s) => s.updateMateria);

  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              nome: initial.nome,
              valor_embalagem: initial.valor_embalagem,
              quantidade_embalagem: initial.quantidade_embalagem,
              unidade_medida: initial.unidade_medida,
              categoria: initial.categoria,
            }
          : empty,
      );
    }
  }, [open, initial]);

  const submit = async () => {
    if (!form.nome.trim()) return toast.error("Informe o nome.");
    if (form.valor_embalagem <= 0) return toast.error("Valor da embalagem deve ser > 0.");
    if (form.quantidade_embalagem <= 0) return toast.error("Quantidade da embalagem deve ser > 0.");
    try {
      if (initial) {
        await updateMateria(initial.id, form);
        toast.success("Salvo com sucesso.");
      } else {
        await addMateria(form);
        toast.success("Criado com sucesso.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };

  const custoUnit =
    form.quantidade_embalagem > 0 ? form.valor_embalagem / form.quantidade_embalagem : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar item" : "Novo item"}
          </DialogTitle>
          <DialogDescription>
            O custo unitário base é calculado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              autoFocus
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Leite condensado"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Valor da embalagem</Label>
              <CurrencyInput
                value={form.valor_embalagem}
                onChange={(v) => setForm({ ...form, valor_embalagem: v })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <NumberInput
                value={form.quantidade_embalagem}
                onChange={(v) => setForm({ ...form, quantidade_embalagem: v })}
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Unidade</Label>
              <Select
                value={form.unidade_medida}
                onValueChange={(v) => setForm({ ...form, unidade_medida: v as Unidade })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="unidade">un</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v as Categoria })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingrediente">Ingrediente</SelectItem>
                  <SelectItem value="embalagem">Embalagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-secondary p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Custo unitário base</span>
            <span className="font-display text-lg font-semibold tabular-nums">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 4,
                maximumFractionDigits: 6,
              }).format(custoUnit)}
              <span className="text-xs text-muted-foreground font-sans font-normal ml-1">
                / {unidadeLabel(form.unidade_medida)}
              </span>
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
