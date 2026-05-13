import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Upload, ChefHat, Box, Layers } from "lucide-react";
import { usePricingStore, custoUnitarioBase } from "@/store/usePricingStore";
import { brl } from "@/lib/format";
import { unidadeLabel } from "@/lib/units";
import { MateriaFormDialog } from "@/components/MateriaFormDialog";
import { MateriaImportDialog } from "@/components/MateriaImportDialog";
import type { MateriaPrima } from "@/store/types";

export const Route = createFileRoute("/materias-primas")({
  head: () => ({
    meta: [
      { title: "Ingredientes — Preciflow" },
      { name: "description", content: "Gerencie ingredientes e insumos, atualize preços e mantenha seus custos sempre precisos." },
      { property: "og:title", content: "Ingredientes — Preciflow" },
      { property: "og:description", content: "Gerencie ingredientes e insumos, atualize preços e mantenha seus custos sempre precisos." },
    ],
  }),
  component: MateriasPage,
});

function MateriasPage() {
  const materias = usePricingStore((s) => s.materias);
  const deleteMateria = usePricingStore((s) => s.deleteMateria);
  const produtos = usePricingStore((s) => s.produtos);

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<MateriaPrima | null>(null);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      materias
        .filter((m) => m.nome.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [materias, q],
  );

  const ingredientes = useMemo(
    () => filtered.filter((m) => m.categoria === "ingrediente"),
    [filtered],
  );
  const embalagens = useMemo(
    () => filtered.filter((m) => m.categoria === "embalagem"),
    [filtered],
  );

  const usageCount = (id: string) =>
    produtos.filter((p) => p.itens.some((i) => i.materia_prima_id === id)).length;

  const renderTabela = (rows: typeof filtered, vazio: string) => {
    if (rows.length === 0) {
      return <div className="p-8 text-center text-sm text-muted-foreground">{vazio}</div>;
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Embalagem</TableHead>
              <TableHead className="text-right">Custo unitário</TableHead>
              <TableHead className="text-right w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="font-medium">{m.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {usageCount(m.id) > 0
                      ? `Em ${usageCount(m.id)} produto(s)`
                      : "Sem uso"}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {brl(m.valor_embalagem)} / {m.quantidade_embalagem}{" "}
                  <span className="text-muted-foreground">{unidadeLabel(m.unidade_medida)}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {brl(custoUnitarioBase(m))}
                  <div className="text-xs text-muted-foreground font-normal">
                    por {unidadeLabel(m.unidade_medida)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Editar ingrediente"
                    onClick={() => {
                      setEditing(m);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Excluir ingrediente"
                    onClick={() => setConfirmId(m.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-semibold">Ingredientes e Embalagens</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus ingredientes e embalagens aqui. O custo unitário é calculado automaticamente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" /> Importar
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo item
            </Button>
          </div>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Accordion type="multiple" defaultValue={["ingredientes", "embalagens"]} className="space-y-3">
          <AccordionItem value="ingredientes" className="border rounded-xl bg-card overflow-hidden px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-lg bg-accent/30 grid place-items-center">
                  <ChefHat className="h-4 w-4 text-primary" />
                </span>
                <span className="font-display text-lg">Ingredientes</span>
                <Badge variant="secondary">{ingredientes.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderTabela(ingredientes, "Nenhum ingrediente cadastrado.")}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="embalagens" className="border rounded-xl bg-card overflow-hidden px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-lg bg-secondary grid place-items-center">
                  <Box className="h-4 w-4 text-primary" />
                </span>
                <span className="font-display text-lg">Embalagens</span>
                <Badge variant="outline">{embalagens.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderTabela(embalagens, "Nenhuma embalagem cadastrada.")}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="text-sm text-muted-foreground">
          Quer começar uma receita?{" "}
          <Link to="/produtos" className="text-primary underline-offset-4 hover:underline">
            Vá para Produtos →
          </Link>
        </p>
      </div>

      <MateriaFormDialog open={open} onOpenChange={setOpen} initial={editing} />
      <MateriaImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir matéria-prima?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela será removida de todos os produtos que a utilizam. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmId) await deleteMateria(confirmId);
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
