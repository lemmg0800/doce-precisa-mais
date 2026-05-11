// @ts-nocheck
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";

const PRICE_MAP: Record<string, string> = {
  mensal: "price_1TTi9kEk3Vivi26bcLKo23kT",
  semestral: "price_1TTi9nEk3Vivi26bghJRP4QY",
  anual: "price_1TTi9mEk3Vivi26brCxHzX9z",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, email, plano } = await req.json();
    const priceId = PRICE_MAP[plano];
    if (!user_id || !email || !priceId) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-11-20.acacia",
    });

    const origin = req.headers.get("origin") || "";

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
  } catch (err) {
    console.error("criar-checkout error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
