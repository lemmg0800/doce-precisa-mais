import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Check, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function translateAuthError(msg: string, code?: string): string {
  const m = msg.toLowerCase();
  if (code === "weak_password" || /weak.*password|password.*weak|known to be weak|easy to guess|pwned/i.test(msg))
    return "Esta senha é muito fraca ou já foi exposta em vazamentos. Escolha uma senha mais forte (combine letras, números e símbolos).";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(msg))
    return "Email ou senha incorretos.";
  if (code === "user_already_exists" || /already registered|already exists/i.test(msg))
    return "Este email já está cadastrado. Faça login.";
  if (/password should be at least/i.test(msg))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (/invalid email/i.test(msg))
    return "Email inválido.";
  if (/rate limit|too many requests/i.test(msg))
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  if (/network|fetch/i.test(m))
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  return msg;
}

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (ready && session) navigate({ to: "/" });
  }, [ready, session, navigate]);

  const resendConfirmation = async (targetEmail: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Email de confirmação reenviado.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao reenviar email";
      toast.error(msg);
    }
  };

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
        setSignupEmailSent(email);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo(a)!");
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : "Erro";
      const code = (err as { code?: string })?.code;
      const isUnconfirmed =
        code === "email_not_confirmed" ||
        /email not confirmed/i.test(rawMsg) ||
        /not confirmed/i.test(rawMsg);
      if (isUnconfirmed && mode === "signin") {
        toast.error("Você precisa confirmar seu email antes de entrar. Verifique sua caixa de entrada.", {
          action: { label: "Reenviar", onClick: () => resendConfirmation(email) },
          duration: 8000,
        });
      } else {
        toast.error(translateAuthError(rawMsg, code));
      }
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar com Google";
      toast.error(msg);
      setBusy(false);
    }
  };

  // Tela de "verifique seu email" após cadastro
  if (signupEmailSent) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-7 w-7" />
            </div>
            <CardTitle className="text-center font-display text-2xl">Confirme seu email</CardTitle>
            <CardDescription className="text-center">
              Enviamos um link de confirmação para{" "}
              <span className="font-medium text-foreground">{signupEmailSent}</span>.
              Clique no link para ativar sua conta antes de entrar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              size="lg"
              onClick={() => {
                setSignupEmailSent(null);
                setMode("signin");
                setPassword("");
              }}
            >
              Voltar para login
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => resendConfirmation(signupEmailSent)}
            >
              Reenviar email de confirmação
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Não recebeu? Confira a pasta de spam ou promoções.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordRules = [
    { label: "Mínimo de 6 caracteres", ok: password.length >= 6 },
  ];

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <img src={logo} alt="Preciflow Logo" className="h-11 w-11 rounded-full object-cover" />
            <div className="leading-tight">
              <h1 className="font-display text-2xl font-semibold">
                {mode === "signin" ? "Entrar no Preciflow" : "Criar conta no Preciflow"}
              </h1>
              <CardDescription className="text-[10px] uppercase tracking-widest">
                Precificação artesanal
              </CardDescription>
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
              {mode === "signup" && (
                <ul className="mt-1 grid gap-1 text-xs text-muted-foreground">
                  {passwordRules.map((r) => (
                    <li
                      key={r.label}
                      className={`flex items-center gap-2 ${r.ok ? "text-emerald-600 dark:text-emerald-500" : ""}`}
                    >
                      <Check className={`h-3.5 w-3.5 ${r.ok ? "opacity-100" : "opacity-40"}`} />
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button type="submit" disabled={busy} size="lg">
              {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={signInWithGoogle}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.42-1.7 4.16-5.5 4.16-3.31 0-6.01-2.74-6.01-6.13s2.7-6.13 6.01-6.13c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.83 3.42 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.48 0 9.11-3.85 9.11-9.27 0-.62-.07-1.1-.16-1.53H12z"/>
              </svg>
              Entrar com Google
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
    </main>
  );
}
