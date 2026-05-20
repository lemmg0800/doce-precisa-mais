import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { AccessGate } from "@/components/AccessGate";

import IndexPage from "@/routes/index";
import AuthPage from "@/routes/auth";
import AssinaturaPage from "@/routes/assinatura";
import SucessoPage from "@/routes/sucesso";
import CanceladoPage from "@/routes/cancelado";
import LandingPage from "@/routes/landing";
import ConfiguracoesPage from "@/routes/configuracoes";
import KitsPage from "@/routes/kits";
import MateriasPrimasPage from "@/routes/materias-primas";
import ProdutosPage from "@/routes/produtos";
import ReceitasPage from "@/routes/receitas";

const PUBLIC_PATHS = ["/auth", "/assinatura", "/sucesso", "/cancelado", "/landing"];

function NotFoundPage() {
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

function AuthGate() {
  const { ready, session } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!session && !PUBLIC_PATHS.includes(loc.pathname)) {
      navigate("/auth");
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthGate />}>
            <Route path="/" element={<IndexPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/assinatura" element={<AssinaturaPage />} />
            <Route path="/sucesso" element={<SucessoPage />} />
            <Route path="/cancelado" element={<CanceladoPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/kits" element={<KitsPage />} />
            <Route path="/materias-primas" element={<MateriasPrimasPage />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            <Route path="/receitas" element={<ReceitasPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
