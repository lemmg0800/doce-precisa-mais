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
import { Plus, Pencil, Trash2, Copy, Search, ChefHat, Settings2, BookOpen } from "lucide-react";
import { usePricingStore, calcularProduto, custoUnitarioReceita } from "@/store/usePricingStore";
import { brl, pct } from "@/lib/format";
import { ProdutoFormDialog } from "@/components/ProdutoFormDialog";
import { CategoriasManagerDialog } from "@/components/CategoriasManagerDialog";
import type { Produto, CategoriaProduto } from "@/store/types";
import { toast } from "sonner";

export const Route = createFileRoute("/produtos")({
  component: ProdutosPage,
});

const SEM_CAT_KEY = "__sem_categoria__";

function ProdutosPage() {
  const produtos = usePricingStore((s) => s.produtos);
  const materias = usePricingStore((s) => s.materias);
  const categorias = usePricingStore((s) => s.categorias);
  const kits = usePricingStore((s) => s.kits);
  const receitas = usePricingStore((s) => s.receitas);
  const config = usePricingStore((s) => s.config);
  const deleteProduto = usePricingStore((s) => s.deleteProduto);
  const duplicateProduto = usePricingStore((s) => s.duplicateProduto);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const grupos = useMemo(() => {
    const filtered = produtos
      .filter((p) => p.nome_produto.toLowerCase().includes(q.toLowerCase()))
      .map((p) => ({ p, calc: calcularProduto(p, materias, config, kits, receitas) }))
      .sort((a, b) => a.p.nome_produto.localeCompare(b.p.nome_produto));

    const sortedCats = [...categorias].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
    const semCat: CategoriaProduto = {
      id: SEM_CAT_KEY,
      nome_categoria: "Sem categoria",
      cor: "#94a3b8",
      ordem_exibicao: 9999,
      ativa: true,
      is_default: true,
    };

    const map = new Map<string, typeof filtered>();
    sortedCats.forEach((c) => map.set(c.id, []));
    map.set(SEM_CAT_KEY, []);

    filtered.forEach((item) => {
      const key = item.p.categoria_id && map.has(item.p.categoria_id)
        ? item.p.categoria_id
        : SEM_CAT_KEY;
      map.get(key)!.push(item);
    });

    const grupos: { cat: CategoriaProduto; itens: typeof filtered }[] = [];
    sortedCats.forEach((c) => {
      const itens = map.get(c.id) ?? [];
      if (itens.length > 0) grupos.push({ cat: c, itens });
    });
    const semCatItens = map.get(SEM_CAT_KEY) ?? [];
    if (semCatItens.length > 0 && !sortedCats.some((c) => c.is_default)) {
      grupos.push({ cat: semCat, itens: semCatItens });
    }
    return grupos;
  }, [produtos, materias, config, kits, receitas, categorias, q]);

  const totalFiltrado = grupos.reduce((s, g) => s + g.itens.length, 0);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-semibold">Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Suas receitas com custo e preço calculados em tempo real.
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
            <Button variant="outline" size="lg" onClick={() => setCatOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" /> Categorias
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo produto
            </Button>
          </div>
        </div>

        {materias.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Cadastre suas matérias-primas antes de criar receitas.{" "}
                <Link to="/materias-primas" className="text-primary underline-offset-4 hover:underline">
                  Ir para matérias-primas →
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {totalFiltrado === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhum produto cadastrado.
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={grupos.map((g) => g.cat.id)}
            className="space-y-3"
          >
            {grupos.map(({ cat, itens }) => (
              <AccordionItem
                key={cat.id}
                value={cat.id}
                className="border rounded-xl bg-card overflow-hidden px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: cat.cor }}
                    />
                    <span className="font-display text-lg">{cat.nome_categoria}</span>
                    <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                      {itens.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
                    {itens.map(({ p, calc }) => (
                      <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-accent/30 grid place-items-center shrink-0">
                                <ChefHat className="h-4 w-4 text-primary" />
                              </div>
                              <CardTitle className="font-display text-xl truncate">
                                {p.nome_produto}
                              </CardTitle>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Rende {p.rendimento} un · {p.itens.length} ingrediente(s)
                            {p.percentual_perda > 0 && ` · perda ${pct(p.percentual_perda)}`}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <Stat label="Custo" value={brl(calc.custo_unitario_produto)} />
                            <Stat label="Mínimo" value={brl(calc.preco_minimo)} tone="warning" />
                            <Stat label="Sugerido" value={brl(calc.preco_sugerido)} tone="success" />
                          </div>

                          {p.preco_praticado != null && p.preco_praticado > 0 ? (
                            <div className="space-y-1.5">
                              <div className="rounded-lg bg-secondary/60 px-3 py-2 text-xs flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Praticado: <strong className="text-foreground">{brl(p.preco_praticado)}</strong>
                                </span>
                                <span
                                  className={
                                    (calc.lucro_unitario_real ?? 0) >= 0
                                      ? "text-success font-medium"
                                      : "text-destructive font-medium"
                                  }
                                >
                                  {(calc.lucro_unitario_real ?? 0) >= 0 ? "+" : ""}
                                  {brl(calc.lucro_unitario_real ?? 0)} ({pct(calc.percentual_lucro_real ?? 0)})
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
                                {calc.diferenca_para_ideal != null && Math.abs(calc.diferenca_para_ideal) > 0.005 && (
                                  <span>
                                    {calc.diferenca_para_ideal > 0 ? "Faltam " : "Acima em "}
                                    <strong className={calc.diferenca_para_ideal > 0 ? "text-destructive" : "text-success"}>
                                      {brl(Math.abs(calc.diferenca_para_ideal))}
                                    </strong>
                                  </span>
                                )}
                              </div>
                              {calc.insight === "abaixo" && (
                                <div className="text-[11px] text-destructive">
                                  Este produto está sendo vendido abaixo do preço ideal.
                                </div>
                              )}
                            </div>
                          ) : null}

                          <div className="flex gap-1 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setEditing(p);
                                setOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await duplicateProduto(p.id);
                                toast.success("Produto duplicado.");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmId(p.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <ProdutoFormDialog open={open} onOpenChange={setOpen} initial={editing} />
      <CategoriasManagerDialog open={catOpen} onOpenChange={setCatOpen} />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmId) await deleteProduto(confirmId);
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-lg bg-secondary/50 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={
          "text-sm font-semibold tabular-nums font-display " +
          (tone === "success"
            ? "text-success"
            : tone === "warning"
              ? "text-primary"
              : "text-foreground")
        }
      >
        {value}
      </div>
    </div>
  );
}
