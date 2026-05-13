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
import { Plus, Pencil, Trash2, Copy, Search, BookOpen } from "lucide-react";
import {
  usePricingStore,
  custoTotalReceita,
  custoUnitarioReceita,
} from "@/store/usePricingStore";
import { brl } from "@/lib/format";
import { unidadeLabel } from "@/lib/units";
import { ReceitaFormDialog } from "@/components/ReceitaFormDialog";
import type { Receita } from "@/store/types";
import { toast } from "sonner";

export const Route = createFileRoute("/receitas")({
  head: () => ({
    meta: [
      { title: "Receitas — Preciflow" },
      { name: "description", content: "Organize massas, recheios e caldas reutilizáveis em múltiplos produtos da sua produção." },
      { property: "og:title", content: "Receitas — Preciflow" },
      { property: "og:description", content: "Organize massas, recheios e caldas reutilizáveis em múltiplos produtos da sua produção." },
    ],
  }),
  component: ReceitasPage,
});

function ReceitasPage() {
  const receitas = usePricingStore((s) => s.receitas);
  const materias = usePricingStore((s) => s.materias);
  const produtos = usePricingStore((s) => s.produtos);
  const deleteReceita = usePricingStore((s) => s.deleteReceita);
  const duplicateReceita = usePricingStore((s) => s.duplicateReceita);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Receita | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      receitas
        .filter((r) => r.nome_receita.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.nome_receita.localeCompare(b.nome_receita)),
    [receitas, q],
  );

  const usageCount = (id: string) =>
    produtos.filter((p) => (p.receitas ?? []).some((pr) => pr.receita_id === id)).length;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-semibold">Receitas</h1>
            <p className="text-muted-foreground mt-1">
              Utilize massas, recheios e caldas em múltiplos produtos.
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
              <Plus className="h-4 w-4 mr-2" /> Nova receita
            </Button>
          </div>
        </div>

        {list.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhuma receita cadastrada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((r) => {
              const total = custoTotalReceita(r, materias);
              const unit = custoUnitarioReceita(r, materias);
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-accent/30 grid place-items-center shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="font-display text-xl truncate">
                        {r.nome_receita}
                      </CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rende {r.rendimento} {unidadeLabel(r.unidade_rendimento)} ·{" "}
                      {r.itens.length} ingrediente(s)
                      {usageCount(r.id) > 0 && ` · em ${usageCount(r.id)} produto(s)`}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-secondary/50 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Total
                        </div>
                        <div className="text-sm font-semibold tabular-nums font-display">
                          {brl(total)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-secondary/50 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Por {unidadeLabel(r.unidade_rendimento)}
                        </div>
                        <div className="text-sm font-semibold tabular-nums font-display text-primary">
                          {brl(unit)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="outline" size="sm" className="flex-1"
                        onClick={() => { setEditing(r); setOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={async () => {
                          await duplicateReceita(r.id);
                          toast.success("Receita duplicada.");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmId(r.id)}>
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

      <ReceitaFormDialog open={open} onOpenChange={setOpen} initial={editing} />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
            <AlertDialogDescription>
              Produtos que usavam esta receita ficarão sem ela. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmId) {
                  await deleteReceita(confirmId);
                  toast.success("Receita excluída.");
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
