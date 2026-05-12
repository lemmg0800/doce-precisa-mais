import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Copy, Search, Box } from "lucide-react";
import { usePricingStore, custoTotalKit } from "@/store/usePricingStore";
import { brl } from "@/lib/format";
import { unidadeLabel } from "@/lib/units";
import { KitFormDialog } from "@/components/KitFormDialog";
import type { KitEmbalagem } from "@/store/types";
import { toast } from "sonner";

export const Route = createFileRoute("/kits")({
  component: KitsPage,
});

function KitsPage() {
  const kits = usePricingStore((s) => s.kits);
  const materias = usePricingStore((s) => s.materias);
  const produtos = usePricingStore((s) => s.produtos);
  const deleteKit = usePricingStore((s) => s.deleteKit);
  const duplicateKit = usePricingStore((s) => s.duplicateKit);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KitEmbalagem | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      kits
        .filter((k) => k.nome_kit.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.nome_kit.localeCompare(b.nome_kit)),
    [kits, q],
  );

  const usageCount = (id: string) =>
    produtos.filter((p) => p.kit_embalagem_id === id).length;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-semibold">Kits de embalagem</h1>
            <p className="text-muted-foreground mt-1">
              Agrupe itens de embalagem e utilize facilmente nos produtos.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button size="lg" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo kit
            </Button>
          </div>
        </div>

        {list.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhum kit cadastrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((k) => {
              const total = custoTotalKit(k, materias);
              return (
                <Card key={k.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-accent/30 grid place-items-center shrink-0">
                        <Box className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="font-display text-xl truncate">{k.nome_kit}</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {k.itens.length} item(s)
                      {usageCount(k.id) > 0 && ` · em ${usageCount(k.id)} produto(s)`}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="text-sm space-y-1">
                      {k.itens.map((it) => {
                        const m = materias.find((x) => x.id === it.materia_prima_id);
                        return (
                          <li key={it.id} className="flex justify-between text-muted-foreground">
                            <span className="truncate">{m?.nome ?? "—"}</span>
                            <span className="tabular-nums">
                              {it.quantidade_utilizada} {unidadeLabel(it.unidade_utilizada ?? m?.unidade_medida ?? null)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Custo do kit
                      </span>
                      <span className="font-display text-lg font-semibold text-primary tabular-nums">
                        {brl(total)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline" size="sm" className="flex-1"
                        onClick={() => { setEditing(k); setOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={async () => {
                          await duplicateKit(k.id);
                          toast.success("Kit duplicado.");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmId(k.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <KitFormDialog open={open} onOpenChange={setOpen} initial={editing} />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir kit?</AlertDialogTitle>
            <AlertDialogDescription>
              Produtos que usavam este kit ficarão sem kit. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmId) {
                  await deleteKit(confirmId);
                  toast.success("Kit excluído.");
                }
                setConfirmId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
