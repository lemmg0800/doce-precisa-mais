import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput, NumberInput } from "@/components/inputs";
import {
  usePricingStore,
  gastosTotalMensal,
  percentualCustoFixoEfetivo,
} from "@/store/usePricingStore";
import type { TipoArredondamento, GastoMensal } from "@/store/types";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, KeyRound, Calculator, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const config = usePricingStore((s) => s.config);
  const updateConfig = usePricingStore((s) => s.updateConfig);
  const exportAll = usePricingStore((s) => s.exportAll);
  const importAll = usePricingStore((s) => s.importAll);
  const gastos = usePricingStore((s) => s.gastos);
  const addGasto = usePricingStore((s) => s.addGasto);
  const updateGasto = usePricingStore((s) => s.updateGasto);
  const deleteGasto = usePricingStore((s) => s.deleteGasto);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newPwd, setNewPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editValor, setEditValor] = useState(0);

  const totalGastos = gastosTotalMensal(gastos);
  const percentualEfetivo = percentualCustoFixoEfetivo(config, gastos);
  const isAuto = config.modo_custo_fixo === "automatico";
  const faturamentoInvalido = isAuto && config.faturamento_mensal_estimado <= 0;

  const addGastoHandler = async () => {
    if (!novoNome.trim()) return toast.error("Informe o nome do gasto.");
    if (!novoValor || novoValor <= 0) return toast.error("Valor mensal deve ser maior que zero.");
    try {
      await addGasto({ nome_gasto: novoNome.trim(), valor_mensal: novoValor });
      setNovoNome("");
      setNovoValor(0);
      toast.success("Gasto adicionado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao adicionar.");
    }
  };

  const startEdit = (g: GastoMensal) => {
    setEditingId(g.id);
    setEditNome(g.nome_gasto);
    setEditValor(g.valor_mensal);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editNome.trim()) return toast.error("Informe o nome do gasto.");
    try {
      await updateGasto(editingId, { nome_gasto: editNome.trim(), valor_mensal: editValor });
      setEditingId(null);
      toast.success("Gasto atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar.");
    }
  };

  const handleExport = () => {
    const data = exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forneria-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup baixado.");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data.materias || !data.produtos) throw new Error("Arquivo inválido");
        await importAll(data);
        toast.success("Dados importados.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Arquivo inválido.");
      }
    };
    reader.readAsText(file);
  };

  const set = (patch: Partial<typeof config>) => updateConfig({ ...config, ...patch });

  const changePassword = async () => {
    if (newPwd.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    setPwdBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success("Senha alterada.");
      setNewPwd("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar senha.");
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Aplicadas automaticamente a todos os produtos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Percentuais e mão de obra</CardTitle>
            <CardDescription>
              Alterações recalculam os preços imediatamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Custo fixo (%) {isAuto && <span className="text-xs text-muted-foreground">(automático)</span>}</Label>
              <NumberInput
                value={isAuto ? Number(percentualEfetivo.toFixed(2)) : config.percentual_custo_fixo}
                onChange={(v) => set({ percentual_custo_fixo: v })}
                suffix="%"
                disabled={isAuto}
              />
              <p className="text-xs text-muted-foreground">
                {isAuto
                  ? "Calculado a partir dos seus gastos mensais."
                  : <>Compõe o <strong>preço mínimo</strong>.</>}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Lucro desejado (%)</Label>
              <NumberInput value={config.percentual_lucro}
                onChange={(v) => set({ percentual_lucro: v })} suffix="%" />
              <p className="text-xs text-muted-foreground">Somado no <strong>preço sugerido</strong>.</p>
            </div>
            <div className="grid gap-2">
              <Label>Valor da hora de trabalho</Label>
              <CurrencyInput value={config.valor_hora_trabalho}
                onChange={(v) => set({ valor_hora_trabalho: v })} />
              <p className="text-xs text-muted-foreground">Usado com o tempo de produção do produto.</p>
            </div>
            <div className="grid gap-2">
              <Label>Arredondamento de preço</Label>
              <Select
                value={config.tipo_arredondamento_preco}
                onValueChange={(v) => set({ tipo_arredondamento_preco: v as TipoArredondamento })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Não arredondar</SelectItem>
                  <SelectItem value="0.10">Para R$ 0,10</SelectItem>
                  <SelectItem value="0.50">Para R$ 0,50</SelectItem>
                  <SelectItem value="1.00">Para R$ 1,00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" /> Custo fixo
            </CardTitle>
            <CardDescription>
              Escolha entre informar o percentual manualmente ou calcular automaticamente a partir dos gastos mensais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm">
                <span className="font-medium">Calcular custo fixo automaticamente</span>
                <span className="block text-xs text-muted-foreground">
                  Soma seus gastos mensais e divide pela produção estimada.
                </span>
              </span>
              <Switch
                checked={isAuto}
                onCheckedChange={(v) => set({ modo_custo_fixo: v ? "automatico" : "manual" })}
              />
            </label>

            {isAuto && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Produção mensal estimada (un.)</Label>
                    <NumberInput
                      value={config.producao_mensal_estimada}
                      onChange={(v) => set({ producao_mensal_estimada: v })}
                      min={0}
                      placeholder="Ex.: 200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gastos mensais</Label>
                  <div className="space-y-2">
                    {gastos.map((g) => (
                      <div key={g.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-secondary/40">
                        {editingId === g.id ? (
                          <>
                            <Input
                              className="col-span-6"
                              value={editNome}
                              onChange={(e) => setEditNome(e.target.value)}
                              placeholder="Nome do gasto"
                            />
                            <div className="col-span-4">
                              <CurrencyInput value={editValor} onChange={setEditValor} />
                            </div>
                            <Button size="icon" variant="ghost" className="col-span-1" onClick={saveEdit}>
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                            <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="col-span-6 text-sm truncate">{g.nome_gasto}</span>
                            <span className="col-span-4 text-sm tabular-nums text-right">{brl(g.valor_mensal)}</span>
                            <Button size="icon" variant="ghost" className="col-span-1" onClick={() => startEdit(g)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost" className="col-span-1"
                              onClick={async () => { await deleteGasto(g.id); toast.success("Gasto removido."); }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    {gastos.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum gasto cadastrado. Adicione abaixo (ex.: aluguel, energia, internet, gás, pró-labore, transporte, marketing, manutenção).
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-end pt-2">
                    <div className="col-span-6">
                      <Input
                        placeholder="Nome do gasto"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <CurrencyInput value={novoValor} onChange={setNovoValor} />
                    </div>
                    <Button className="col-span-2" onClick={addGastoHandler}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Custo fixo total/mês</div>
                    <div className="font-display text-lg font-semibold tabular-nums">{brl(totalGastos)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Custo fixo por unidade</div>
                    <div className="font-display text-lg font-semibold tabular-nums">{brl(cfPorUnidade)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Percentual aplicado</div>
                    <div className="font-display text-lg font-semibold tabular-nums text-primary">
                      {percentualEfetivo.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {(gastos.length === 0 || config.producao_mensal_estimada <= 0) && (
                  <p className="text-xs text-destructive">
                    Para calcular automaticamente: cadastre ao menos um gasto e informe a produção mensal estimada.
                  </p>
                )}
                {gastos.length > 0 && config.producao_mensal_estimada > 0 && custoMedio <= 0 && (
                  <p className="text-xs text-muted-foreground">
                    Cadastre produtos para que o percentual seja calculado. Enquanto isso, o valor manual ({config.percentual_custo_fixo}%) continua sendo usado.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Backup dos dados</CardTitle>
            <CardDescription>
              Seus dados ficam salvos na nuvem. Exporte para guardar uma cópia local.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Baixar backup agora
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Importar JSON
            </Button>
            <input
              ref={fileRef} type="file" accept="application/json" hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Alterar senha</CardTitle>
            <CardDescription>Defina uma nova senha de acesso.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Input
              type="password"
              placeholder="Nova senha (mín. 6)"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              minLength={6}
              autoComplete="new-password"
            />
            <Button onClick={changePassword} disabled={pwdBusy}>
              <KeyRound className="h-4 w-4 mr-2" />
              {pwdBusy ? "Salvando..." : "Atualizar senha"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
