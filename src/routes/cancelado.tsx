import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cancelado")({
  component: CanceladoPage,
  head: () => ({ meta: [{ title: "Pagamento cancelado" }] }),
});

function CanceladoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <XCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="text-3xl font-bold">Pagamento cancelado</h1>
        <p className="text-muted-foreground">
          Você cancelou o pagamento. Nenhuma cobrança foi realizada.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/assinatura">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Voltar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
