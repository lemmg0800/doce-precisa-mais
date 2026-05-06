import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/assinatura")({
  component: AssinaturaPage,
  head: () => ({ meta: [{ title: "Planos de assinatura" }] }),
});

const PLANOS = [
  { id: "mensal", nome: "Mensal", preco: "R$ 29,90/mês", destaque: false },
  { id: "semestral", nome: "Semestral", preco: "R$ 149,90/sem", destaque: true },
  { id: "anual", nome: "Anual", preco: "R$ 269,90/ano", destaque: false },
];

function AssinaturaPage() {
  const { user, ready } = useAuth();
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
    } catch (e: any) {
      toast.error(e.message);
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-2">Escolha seu plano</h1>
        <p className="text-center text-muted-foreground mb-10">
          Acesso completo ao sistema de precificação
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANOS.map((p) => (
            <Card key={p.id} className={p.destaque ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <CardTitle>{p.nome}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  {p.preco}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant={p.destaque ? "default" : "outline"}
                  onClick={() => assinar(p.id)}
                  disabled={loading !== null}
                >
                  {loading === p.id ? "Carregando..." : "Assinar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
