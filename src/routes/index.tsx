import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePricingStore, calcularProduto, useConfigEfetiva, type ProdutoCalculos } from "@/store/usePricingStore";
import type { Produto } from "@/store/types";
import { brl, pct } from "@/lib/format";
import {
  ChefHat, Package, Settings, ArrowRight, TrendingUp, TrendingDown,
  Award, AlertTriangle, BadgeCheck, Tag, SquareStack
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

type EnrichedProduto = { p: Produto; calc: ProdutoCalculos };

function Home() {
  const materias = usePricingStore((s) => s.materias);
  const produtos = usePricingStore((s) => s.produtos);
  const kits = usePricingStore((s) => s.kits);
  const receitas = usePricingStore((s) => s.receitas);
  const config = useConfigEfetiva();

  const enriched = useMemo<EnrichedProduto[]>(
    () =>
      produtos.map((p) => ({ p, calc: calcularProduto(p, materias, config, kits, receitas) })),
    [produtos, materias, config, kits, receitas],
  );

  const validos = enriched.filter((e) => e.calc.preco_efetivo > 0);

  const lucroMedio = validos.length > 0
    ? validos.reduce((s, e) => s + e.calc.lucro_unitario, 0) / validos.length
    : 0;

  const algumComPrecoReal = validos.some((e) => e.calc.usando_preco_real);

  const maisLucrativo = validos.reduce<EnrichedProduto | null>(
    (best, cur) => (!best || cur.calc.lucro_unitario > best.calc.lucro_unitario ? cur : best),
    null,
  );
  const menorMargem = validos.reduce<EnrichedProduto | null>(
    (worst, cur) =>
      (!worst || cur.calc.percentual_lucro < worst.calc.percentual_lucro ? cur : worst),
    null,
  );

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-secondary px-5 py-5 md:px-7 md:py-6 mb-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-display font-semibold leading-tight">
            Cada receita <span className="text-primary italic">no preço certo.</span>
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/produtos">
                <SquareStack className="h-4 w-4 mr-1" /> Ver produtos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/materias-primas">Matérias-primas</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard icon={Package} label="Matérias-primas" value={materias.length.toString()} to="/materias-primas" />
        <KpiCard icon={ChefHat} label="Produtos" value={produtos.length.toString()} to="/produtos" />
        <KpiCard
          icon={Settings}
          label="Margem total"
          value={pct(config.percentual_custo_fixo + config.percentual_lucro, 0)}
          to="/configuracoes"
        />
      </div>

      {validos.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">Indicadores de lucro</h2>
            <BaseBadge real={algumComPrecoReal} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <InsightCard
              icon={TrendingUp}
              tone="primary"
              label="Lucro médio por produto"
              value={brl(lucroMedio)}
              hint={`${validos.length} produto(s) considerado(s)`}
            />
            <InsightCard
              icon={Award}
              tone="success"
              label="Mais lucrativo"
              value={maisLucrativo ? maisLucrativo.p.nome_produto : "—"}
              hint={maisLucrativo ? `${brl(maisLucrativo.calc.lucro_unitario)} por un` : undefined}
              badge={maisLucrativo?.calc.usando_preco_real ? "real" : "sugerido"}
            />
            <InsightCard
              icon={AlertTriangle}
              tone={menorMargem && menorMargem.calc.lucro_unitario < 0 ? "destructive" : "warning"}
              label="Menor margem"
              value={menorMargem ? menorMargem.p.nome_produto : "—"}
              hint={menorMargem ? `${pct(menorMargem.calc.percentual_lucro)} sobre o mínimo` : undefined}
              badge={menorMargem?.calc.usando_preco_real ? "real" : "sugerido"}
            />
          </div>

          <SimuladorLucro produtos={enriched} />
        </>
      )}

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display">Resumo de produtos</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link to="/produtos">
              Todos <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {enriched.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum produto ainda.</p>
          ) : (
            <ul className="divide-y">
              {enriched.slice(0, 6).map(({ p, calc }) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {p.nome_produto}
                      {calc.usando_preco_real && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-success">
                          <BadgeCheck className="h-3 w-3" /> real
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Custo {brl(calc.custo_unitario_produto)} · lucro{" "}
                      <span className={calc.lucro_unitario >= 0 ? "text-success" : "text-destructive"}>
                        {brl(calc.lucro_unitario)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums text-primary font-display">
                      {brl(calc.preco_efetivo)}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-end gap-1">
                      {calc.usando_preco_real ? (
                        <><Tag className="h-3 w-3" /> praticado</>
                      ) : (
                        <><TrendingUp className="h-3 w-3" /> sugerido</>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function BaseBadge({ real }: { real: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border " +
        (real
          ? "bg-success/10 text-success border-success/30"
          : "bg-secondary text-muted-foreground border-transparent")
      }
    >
      {real ? <BadgeCheck className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
      {real ? "Baseado no preço real" : "Baseado no preço sugerido"}
    </span>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
  badge?: "real" | "sugerido";
}) {
  const toneCls =
    tone === "success" ? "text-success bg-success/10"
      : tone === "warning" ? "text-primary bg-accent/30"
      : tone === "destructive" ? "text-destructive bg-destructive/10"
      : "text-primary bg-secondary";
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className={"h-10 w-10 rounded-xl grid place-items-center " + toneCls}>
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {badge === "real" ? "preço real" : "preço sugerido"}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-2xl font-display font-semibold tabular-nums mt-1 truncate">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
    </div>
  );
}

function SimuladorLucro({ produtos }: { produtos: EnrichedProduto[] }) {
  const [selId, setSelId] = useState<string>(produtos[0]?.p.id ?? "");
  const [qtd, setQtd] = useState<number>(10);
  const sel = produtos.find((e) => e.p.id === selId) ?? produtos[0];

  if (!sel) return null;

  const total = sel.calc.lucro_unitario * (qtd || 0);
  const tone = total >= 0 ? "text-success" : "text-destructive";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-display">Simulação de lucro</CardTitle>
        <BaseBadge real={sel.calc.usando_preco_real} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-1">
            <Label className="text-xs">Produto</Label>
            <select
              className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={sel.p.id}
              onChange={(e) => setSelId(e.target.value)}
            >
              {produtos.map((e) => (
                <option key={e.p.id} value={e.p.id}>
                  {e.p.nome_produto}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Quantidade</Label>
            <Input
              type="number"
              min={0}
              value={qtd}
              onChange={(e) => setQtd(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div className="rounded-xl bg-secondary/60 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Lucro estimado
            </div>
            <div className={"text-2xl font-display font-semibold tabular-nums " + tone}>
              {brl(total)}
            </div>
            <div className="text-xs text-muted-foreground">
              {brl(sel.calc.lucro_unitario)}/un · preço {brl(sel.calc.preco_efetivo)}
            </div>
          </div>
        </div>

        {sel.calc.usando_preco_real && sel.calc.diferenca_para_ideal != null && (
          <div className="mt-4 text-xs flex items-center gap-2">
            {sel.calc.insight === "abaixo" && (
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <TrendingDown className="h-3.5 w-3.5" />
                Este produto está sendo vendido abaixo do preço ideal. Diferença:{" "}
                <strong>{brl(sel.calc.diferenca_para_ideal)}</strong>
              </span>
            )}
            {sel.calc.insight === "acima" && (
              <span className="inline-flex items-center gap-1.5 text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                Produto com margem acima do esperado.
              </span>
            )}
            {sel.calc.insight === "ideal" && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <BadgeCheck className="h-3.5 w-3.5" /> Vendido exatamente no preço sugerido.
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  to: "/" | "/materias-primas" | "/produtos" | "/configuracoes";
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
      </div>
      <div className="mt-4">
        <div className="text-3xl font-display font-semibold tabular-nums">{value}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
          {label}
        </div>
      </div>
    </Link>
  );
}
