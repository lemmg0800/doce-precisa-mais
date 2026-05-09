import { Outlet, Link, createRootRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { AccessGate } from "@/components/AccessGate";

const PUBLIC_PATHS = ["/auth", "/assinatura", "/sucesso", "/cancelado"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <TooltipProvider delayDuration={150}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
      <Toaster position="top-center" richColors />
    </TooltipProvider>
  );
}

function AuthGate() {
  const { ready, session } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!session && loc.pathname !== "/auth") {
      navigate({ to: "/auth" });
    }
  }, [ready, session, loc.pathname, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.includes(loc.pathname);
  if (!session || isPublic) return <Outlet />;
  return (
    <AccessGate>
      <Outlet />
    </AccessGate>
  );
}
