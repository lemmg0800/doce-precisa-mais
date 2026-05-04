import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (ready && session) navigate({ to: "/" });
  }, [ready, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo(a)!");
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center font-display font-bold text-xl">
              ƒ
            </div>
            <div>
              <CardTitle className="font-display text-2xl">Forneria</CardTitle>
              <CardDescription>Precificação artesanal</CardDescription>
            </div>
          </div>
          <CardDescription>
            {mode === "signin" ? "Entre com seu e-mail e senha." : "Crie sua conta para começar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </div>
            <Button type="submit" disabled={busy} size="lg">
              {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin"
                ? "Primeiro acesso? Criar conta"
                : "Já tem uma conta? Entrar"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
