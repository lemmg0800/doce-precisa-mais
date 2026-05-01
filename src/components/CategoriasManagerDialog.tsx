import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, X } from "lucide-react";
import { usePricingStore } from "@/store/usePricingStore";
import type { CategoriaProduto } from "@/store/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (cat: CategoriaProduto) => void;
}

const CORES_PRESET = [
  "#94a3b8", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export function CategoriasManagerDialog({ open, onOpenChange, onCreated }: Props) {
  const categorias = usePricingStore((s) => s.categorias);
  const produtos = usePricingStore((s) => s.produtos);
  const addCategoria = usePricingStore((s) => s.addCategoria);
  const updateCategoria = usePricingStore((s) => s.updateCategoria);
  const deleteCategoria = usePricingStore((s) => s.deleteCategoria);
  const reorderCategorias = usePricingStore((s) => s.reorderCategorias);

  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState(CORES_PRESET[6]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCor, setEditCor] = useState("");

  const sorted = [...categorias].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);

  const contagem = (id: string) => produtos.filter((p) => p.categoria_id === id).length;

  const handleCreate = async () => {
    const nome = novoNome.trim();
    if (!nome) return toast.error("Informe o nome da categoria.");
    try {
      const nova = await addCategoria({ nome_categoria: nome, cor: novaCor, ativa: true });
      toast.success("Categoria criada.");
      setNovoNome("");
      onCreated?.(nova);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar categoria.");
    }
  };

  const startEdit = (c: CategoriaProduto) => {
    setEditId(c.id);
    setEditNome(c.nome_categoria);
    setEditCor(c.cor);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const nome = editNome.trim();
    if (!nome) return toast.error("Nome obrigatório.");
    try {
      await updateCategoria(editId, { nome_categoria: nome, cor: editCor });
      toast.success("Categoria atualizada.");
      setEditId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategoria(id);
      toast.success("Categoria excluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const newOrder = [...sorted];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    try {
      await reorderCategorias(newOrder.map((c) => c.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reordenar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Categorias de produto</DialogTitle>
          <DialogDescription>
            Organize seus produtos. Categorias em uso não podem ser excluídas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Criar nova */}
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <Label>Nova categoria</Label>
            <div className="flex gap-2">
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex.: Bolos"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Criar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {CORES_PRESET.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNovaCor(c)}
                  className={
                    "h-7 w-7 rounded-full border-2 transition " +
                    (novaCor === c ? "border-foreground scale-110" : "border-transparent")
                  }
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {sorted.map((c, idx) => {
              const total = contagem(c.id);
              const isEditing = editId === c.id;
              return (
                <div
                  key={c.id}
                  className="rounded-lg border bg-card p-3 flex items-center gap-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => move(idx, 1)}
                      disabled={idx === sorted.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        type="color"
                        value={editCor}
                        onChange={(e) => setEditCor(e.target.value)}
                        className="h-8 w-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={saveEdit}>
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className="h-4 w-4 rounded-full shrink-0"
                        style={{ background: c.cor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {c.nome_categoria}
                          {c.is_default && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                              padrão
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {total} produto{total !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={c.ativa}
                          onCheckedChange={(v) =>
                            updateCategoria(c.id, { ativa: v }).catch(() =>
                              toast.error("Erro ao atualizar."),
                            )
                          }
                        />
                        <Button size="icon" variant="ghost" onClick={() => startEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={c.is_default}
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
