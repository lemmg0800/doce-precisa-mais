import { Link } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { usePageMeta } from "@/lib/usePageMeta";

export default function SucessoPage() {
  usePageMeta({ title: "Pagamento aprovado" });
  return <SucessoPageInner />;
}

function SucessoPageInner() {
  const { refresh } = useSubscription();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
        <h1 className="text-3xl font-bold">Pagamento aprovado!</h1>
        <p className="text-muted-foreground">
          Acesso liberado automaticamente. Obrigado pela sua assinatura.
        </p>
        <Button asChild size="lg">
          <Link to="/">Voltar ao sistema</Link>
        </Button>
      </div>
    </main>
  );
}
