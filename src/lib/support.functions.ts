import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ASSUNTOS = [
  "Sugestão",
  "Reclamação",
  "Problema técnico",
  "Dúvida",
  "Erro no sistema",
  "Cobrança/Assinatura",
  "Outro",
] as const;

const schema = z.object({
  assunto: z.enum(ASSUNTOS),
  mensagem: z.string().trim().min(10).max(2000),
});

const lastSendByUser = new Map<string, number>();
const RATE_LIMIT_MS = 30_000;
const DESTINO = "soludigi.alquimista@gmail.com";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const authHeader = getRequestHeader("Authorization") || getRequestHeader("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Não autenticado.");
    }
    const token = authHeader.slice(7);
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData.user?.email) {
      throw new Error("Não foi possível identificar o usuário.");
    }
    const userEmail = userData.user.email;
    const userId = userData.user.id;

    const now = Date.now();
    const last = lastSendByUser.get(userId) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - last)) / 1000);
      throw new Error(`Aguarde ${wait}s antes de enviar outra mensagem.`);
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada.");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada.");

    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
        <h2 style="margin:0 0 12px">Nova mensagem de suporte — Preciflow</h2>
        <table cellpadding="6" style="border-collapse:collapse;border:1px solid #e5e7eb">
          <tr><td style="background:#f9fafb"><strong>De</strong></td><td>${escapeHtml(userEmail)}</td></tr>
          <tr><td style="background:#f9fafb"><strong>Assunto</strong></td><td>${escapeHtml(data.assunto)}</td></tr>
          <tr><td style="background:#f9fafb"><strong>Data/Hora</strong></td><td>${escapeHtml(dataHora)}</td></tr>
        </table>
        <h3 style="margin:16px 0 6px">Mensagem</h3>
        <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:6px">${escapeHtml(data.mensagem)}</div>
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
        subject: `[Preciflow] ${data.assunto} — ${userEmail}`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error", res.status, body);
      throw new Error("Falha ao enviar a mensagem. Tente novamente em instantes.");
    }

    lastSendByUser.set(userId, now);
    return { ok: true };
  });
