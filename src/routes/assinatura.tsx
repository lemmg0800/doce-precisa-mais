import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Sparkles, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/assinatura")({
  component: AssinaturaPage,
  head: () => ({
    meta: [
      { title: "Continue usando — escolha seu plano" },
      {
        name: "description",
        content:
          "Continue precificando com segurança. Escolha o plano que melhor se encaixa no seu negócio.",
      },
    ],
  }),
});

const PLANOS = [
  {
    id: "mensal",
    nome: "Mensal",
    preco: "R$ 9,90",
    periodo: "/mês",
    equivalente: null as string | null,
    economia: null as string | null,
    descricao: "Ideal para uso contínuo com flexibilidade",
    destaque: false,
    cta: "Continuar usando",
  },
  {
    id: "semestral",
    nome: "Semestral",
    preco: "R$ 54,00",
    periodo: "a cada 6 meses",
    equivalente: "Equivalente a R$ 9,00/mês",
    economia: "Economize cerca de 10%",
    descricao: "Melhor custo-benefício para quem já validou o sistema",
    destaque: true,
    cta: "Desbloquear acesso",
  },
  {
    id: "anual",
    nome: "Anual",
    preco: "R$ 100,00",
    periodo: "/ano",
    equivalente: "Equivalente a R$ 8,33/mês",
    economia: "Economize cerca de 15%",
    descricao: "Maior economia para uso de longo prazo",
    destaque: false,
    cta: "Continuar usando",
  },
];

function AssinaturaPage() {
  const { user, ready } = useAuth();
  const { reason, trialDaysLeft } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  async function assinar(plano: string) {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setLoading(plano);
    try {
      const { data, error } = await supabase.functions.invoke("criar-checkout", {
        body: { user_id: user.id, email: user.email, plano },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("URL de checkout não retornada");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar checkout.");
      setLoading(null);
    }
  }

  const titulo =
    reason === "expirado"
      ? "Seu período de teste terminou — escolha um plano para continuar"
      : reason === "atrasado_tolerancia"
        ? "Regularize seu pagamento para continuar"
        : "Continue usando o sistema sem limitações";

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao início
            </Link>
          </Button>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-semibold mb-3">{titulo}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Você já viu como funciona. Agora continue precificando com segurança e sem perder
            dinheiro.
          </p>
          {reason === "trial" && trialDaysLeft !== null && (
            <p className="mt-3 text-sm text-primary">
              Você ainda tem <strong>{trialDaysLeft} dia(s)</strong> de teste — assine agora e
              garanta acesso contínuo.
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {PLANOS.map((p) => (
            <Card
              key={p.id}
              className={
                p.destaque
                  ? "border-primary border-2 shadow-xl relative md:scale-105"
                  : "relative"
              }
            >
              {p.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                  <Sparkles className="h-3 w-3" /> Mais escolhido
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-display">{p.nome}</CardTitle>
                <CardDescription>{p.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <div className="text-3xl font-bold text-foreground">{p.preco}</div>
                  <div className="text-sm text-muted-foreground">{p.periodo}</div>
                  {p.equivalente && (
                    <div className="text-sm text-foreground mt-1">{p.equivalente}</div>
                  )}
                  {p.economia && (
                    <div className="inline-block mt-2 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      {p.economia}
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  size={p.destaque ? "lg" : "default"}
                  variant={p.destaque ? "default" : "outline"}
                  onClick={() => assinar(p.id)}
                  disabled={loading !== null}
                >
                  {loading === p.id ? "Carregando..." : p.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center space-y-2">
          <p className="text-base font-medium text-foreground">
            Pare de chutar preços e evite prejuízo em cada venda.
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            O acesso completo será bloqueado até a ativação de um plano.
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2 pt-2">
            <ShieldCheck className="h-3 w-3" />
            Pagamento seguro processado por Stripe. Cancele quando quiser.
          </p>
        </div>
      </div>
    </div>
  );
}
