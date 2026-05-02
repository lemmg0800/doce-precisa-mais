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
import { usePricingStore } from "@/store/usePricingStore";
import type { TipoArredondamento } from "@/store/types";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, KeyRound, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const config = usePricingStore((s) => s.config);
  const updateConfig = usePricingStore((s) => s.updateConfig);
  const exportAll = usePricingStore((s) => s.exportAll);
  const importAll = usePricingStore((s) => s.importAll);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newPwd, setNewPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

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
              <Label>Custo fixo (%)</Label>
              <NumberInput value={config.percentual_custo_fixo}
                onChange={(v) => set({ percentual_custo_fixo: v })} suffix="%" />
              <p className="text-xs text-muted-foreground">Compõe o <strong>preço mínimo</strong>.</p>
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
