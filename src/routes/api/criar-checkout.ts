import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

const PRICE_MAP: Record<string, string> = {
  mensal: "price_1TTU5ZIxq4nJu67Txt8mETbA",
  semestral: "price_1TTU5ZIxq4nJu67TIPYC20i4",
  anual: "price_1TTU5ZIxq4nJu67TBg2yZnBz",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/criar-checkout")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const { user_id, email, plano } = await request.json();
          const priceId = PRICE_MAP[plano];
          if (!user_id || !email || !priceId) {
            return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-02-24.acacia" as any,
          });

          const origin = request.headers.get("origin") || new URL(request.url).origin;

          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer_email: email,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/sucesso`,
            cancel_url: `${origin}/cancelado`,
            metadata: { user_id, plano },
            subscription_data: { metadata: { user_id, plano } },
          });

          return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (err: any) {
          console.error("criar-checkout error:", err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
