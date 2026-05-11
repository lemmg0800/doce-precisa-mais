// @ts-nocheck
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function planoFromPriceId(priceId?: string | null): string | null {
  switch (priceId) {
    case "price_1TTi9kEk3Vivi26bcLKo23kT": return "mensal";
    case "price_1TTi9nEk3Vivi26bghJRP4QY": return "semestral";
    case "price_1TTi9mEk3Vivi26brCxHzX9z": return "anual";
    default: return null;
  }
}

function mapStatus(s: string): string {
  if (s === "active" || s === "trialing") return "ativo";
  if (s === "past_due" || s === "unpaid") return "atrasado";
  if (s === "canceled") return "cancelado";
  return s;
}

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-11-20.acacia",
  });
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch (err) {
    console.error("Signature verification failed:", (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.user_id;
        if (!userId) break;
        const subId = s.subscription as string | null;
        const customerId = s.customer as string | null;
        let plano = s.metadata?.plano ?? null;
        let currentPeriodEnd: string | null = null;

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          plano = plano ?? planoFromPriceId(sub.items.data[0]?.price.id);
          currentPeriodEnd = new Date((sub as any).current_period_end * 1000).toISOString();
        }

        await supabase.from("assinaturas").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            plano,
            status: "ativo",
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "user_id" },
        );
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as any;
        const subId = inv.subscription as string | null;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        await supabase.from("assinaturas").update({
          status: "ativo",
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          plano: planoFromPriceId(sub.items.data[0]?.price.id),
        }).eq("user_id", userId);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as any;
        const subId = inv.subscription as string | null;
        if (!subId) break;
        await supabase.from("assinaturas")
          .update({ status: "atrasado" })
          .eq("stripe_subscription_id", subId);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from("assinaturas")
          .update({ status: "cancelado" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from("assinaturas").update({
          status: mapStatus(sub.status),
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          plano: planoFromPriceId(sub.items.data[0]?.price.id),
        }).eq("stripe_subscription_id", sub.id);
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
