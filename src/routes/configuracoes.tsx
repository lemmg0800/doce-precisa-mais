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
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, KeyRound, Calculator, Plus, Trash2, Pencil, Check, X, Lock, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const { reason } = useSubscription();
  const { user } = useAuth();
  const isAssinante = reason === "ativo";
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

  // Fale conosco
  const [contatoAssunto, setContatoAssunto] = useState<string>("");
  const [contatoMensagem, setContatoMensagem] = useState("");
  const [contatoBusy, setContatoBusy] = useState(false);
  const [contatoSucesso, setContatoSucesso] = useState(false);

  const enviarContato = async () => {
    if (!user) return toast.error("Faça login para enviar.");
    if (!contatoAssunto) return toast.error("Selecione um assunto.");
    const msg = contatoMensagem.trim();
    if (msg.length < 10) return toast.error("Mensagem muito curta (mín. 10 caracteres).");
    if (msg.length > 2000) return toast.error("Mensagem muito longa (máx. 2000 caracteres).");
    setContatoBusy(true);
    try {
      const { error } = await supabase.from("mensagens_contato").insert({
        user_id: user.id,
        email_remetente: user.email ?? "",
        assunto: contatoAssunto,
        mensagem: msg,
      });
      if (error) throw error;
      setContatoMensagem("");
      setContatoAssunto("");
      setContatoSucesso(true);
      setTimeout(() => setContatoSucesso(false), 4000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar mensagem.");
    } finally {
      setContatoBusy(false);
    }
  };

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
    if (!isAssinante) {
      toast.error("Exportação disponível apenas para assinantes ativos");
      return;
    }
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
                  Soma seus gastos mensais e divide pelo faturamento médio mensal.
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
                    <Label>Faturamento mensal estimado (R$)</Label>
                    <CurrencyInput
                      value={config.faturamento_mensal_estimado}
                      onChange={(v) => set({ faturamento_mensal_estimado: v })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Informe quanto você fatura, em média, por mês.
                    </p>
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
                    <div className="text-muted-foreground text-xs">Faturamento mensal</div>
                    <div className="font-display text-lg font-semibold tabular-nums">{brl(config.faturamento_mensal_estimado)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Percentual aplicado</div>
                    <div className="font-display text-lg font-semibold tabular-nums text-primary">
                      {percentualEfetivo.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {faturamentoInvalido && (
                  <p className="text-xs text-destructive">
                    Informe um faturamento mensal maior que zero.
                  </p>
                )}
                {!faturamentoInvalido && gastos.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Cadastre ao menos um gasto mensal para que o percentual seja calculado. Enquanto isso, o valor manual ({config.percentual_custo_fixo}%) continua sendo usado.
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
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={!isAssinante}
                title={!isAssinante ? "Exportação disponível apenas para assinantes ativos" : undefined}
              >
                {isAssinante ? (
                  <Download className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Baixar backup agora
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
            </div>
            {!isAssinante && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Exportação disponível apenas para assinantes ativos.{" "}
                <Link to="/assinatura" className="text-primary hover:underline">
                  Assinar agora
                </Link>
              </p>
            )}
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

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Fale conosco
            </CardTitle>
            <CardDescription>
              Envie sugestões, reclamações ou relate problemas. Responderemos no e-mail da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">
              Enviando como: <span className="font-medium text-foreground">{user?.email ?? "—"}</span>
            </div>
            <div className="grid gap-2">
              <Label>Assunto</Label>
              <Select value={contatoAssunto} onValueChange={setContatoAssunto}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sugestao">Sugestão</SelectItem>
                  <SelectItem value="reclamacao">Reclamação</SelectItem>
                  <SelectItem value="problema_tecnico">Problema técnico</SelectItem>
                  <SelectItem value="duvida">Dúvida</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mensagem</Label>
              <Textarea
                rows={5}
                maxLength={2000}
                placeholder="Conte com detalhes (mín. 10 caracteres)…"
                value={contatoMensagem}
                onChange={(e) => setContatoMensagem(e.target.value)}
              />
              <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                {contatoMensagem.trim().length}/2000
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={enviarContato} disabled={contatoBusy}>
                <Send className="h-4 w-4 mr-2" />
                {contatoBusy ? "Enviando…" : "Enviar"}
              </Button>
              {contatoSucesso && (
                <span className="flex items-center gap-1.5 text-sm text-success animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Mensagem enviada com sucesso!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
