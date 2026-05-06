import { Link } from "@tanstack/react-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle } from "lucide-react";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const { loading, hasAccess, reason, trialDaysLeft, graceDaysLeft } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm">Verificando assinatura...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-md w-full text-center rounded-2xl border bg-card p-8 shadow-lg">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 grid place-items-center mb-4">
            <Lock className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-2">Seu acesso expirou</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {reason === "expirado"
              ? "Seu período de teste ou assinatura terminou. Assine um plano para continuar."
              : "Você ainda não possui uma assinatura ativa."}
          </p>
          <Button asChild className="w-full">
            <Link to="/assinatura">Assinar plano</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {reason === "trial" && trialDaysLeft !== null && (
        <TrialBanner daysLeft={trialDaysLeft} />
      )}
      {reason === "atrasado_tolerancia" && graceDaysLeft !== null && (
        <GraceBanner daysLeft={graceDaysLeft} />
      )}
      {children}
    </>
  );
}

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="bg-primary/10 border-b border-primary/20 text-center text-sm py-2 px-4 flex items-center justify-center gap-3">
      <AlertCircle className="h-4 w-4 text-primary" />
      <span>
        Você está no período de teste — <strong>{daysLeft} dia(s) restantes</strong>.
      </span>
      <Link to="/assinatura" className="text-primary font-medium hover:underline">
        Assinar agora
      </Link>
    </div>
  );
}

function GraceBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="bg-destructive/10 border-b border-destructive/20 text-center text-sm py-2 px-4 flex items-center justify-center gap-3">
      <AlertCircle className="h-4 w-4 text-destructive" />
      <span>
        Pagamento atrasado — acesso por mais <strong>{daysLeft} dia(s)</strong>.
      </span>
      <Link to="/assinatura" className="text-destructive font-medium hover:underline">
        Regularizar
      </Link>
    </div>
  );
}
