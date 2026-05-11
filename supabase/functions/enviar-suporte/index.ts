// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ASSUNTOS = [
  "Sugestão",
  "Reclamação",
  "Problema técnico",
  "Dúvida",
  "Erro no sistema",
  "Cobrança/Assinatura",
  "Outro",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DESTINO = "soludigi.alquimista@gmail.com";
const RATE_LIMIT_MS = 30_000;
const lastSendByUser = new Map<string, number>();

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const token = authHeader.slice(7);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Usuário inválido." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const userEmail = userData.user.email;
    const userId = userData.user.id;

    const now = Date.now();
    const last = lastSendByUser.get(userId) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - last)) / 1000);
      return new Response(JSON.stringify({ error: `Aguarde ${wait}s antes de enviar outra mensagem.` }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const assunto = String(body?.assunto ?? "");
    const mensagem = String(body?.mensagem ?? "").trim();

    if (!ASSUNTOS.includes(assunto)) {
      return new Response(JSON.stringify({ error: "Assunto inválido." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (mensagem.length < 10 || mensagem.length > 2000) {
      return new Response(JSON.stringify({ error: "Mensagem deve ter entre 10 e 2000 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Serviço de e-mail não configurado." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
        <h2 style="margin:0 0 12px">Nova mensagem de suporte — Preciflow</h2>
        <table cellpadding="6" style="border-collapse:collapse;border:1px solid #e5e7eb">
          <tr><td style="background:#f9fafb"><strong>De</strong></td><td>${escapeHtml(userEmail)}</td></tr>
          <tr><td style="background:#f9fafb"><strong>Assunto</strong></td><td>${escapeHtml(assunto)}</td></tr>
          <tr><td style="background:#f9fafb"><strong>Data/Hora</strong></td><td>${escapeHtml(dataHora)}</td></tr>
        </table>
        <h3 style="margin:16px 0 6px">Mensagem</h3>
        <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:6px">${escapeHtml(mensagem)}</div>
      </div>
    `;

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Preciflow Suporte <onboarding@resend.dev>",
        to: [DESTINO],
        reply_to: userEmail,
        subject: `[Preciflow] ${assunto} — ${userEmail}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error", res.status, err);
      return new Response(JSON.stringify({ error: "Falha ao enviar a mensagem. Tente novamente." }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    lastSendByUser.set(userId, now);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("enviar-suporte error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
