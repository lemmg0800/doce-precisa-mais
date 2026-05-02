import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ChefHat, Package, Settings, LayoutDashboard, Box, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/produtos", label: "Produtos", icon: ChefHat },
  { to: "/materias-primas", label: "Matérias", icon: Package },
  { to: "/receitas", label: "Receitas", icon: BookOpen },
  { to: "/kits", label: "Kits", icon: Box },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-display font-bold">
              ƒ
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-semibold">Forneria</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Precificação artesanal
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              className="ml-1 text-muted-foreground"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 pb-28 md:pb-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className={cn(
          "md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur grid",
          links.length === 6 ? "grid-cols-6" : "grid-cols-5",
        )}
      >
        {links.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
