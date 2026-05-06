import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function planoFromPriceId(priceId?: string | null): string | null {
  switch (priceId) {
    case "price_1TTU5ZIxq4nJu67Txt8mETbA":
      return "mensal";
    case "price_1TTU5ZIxq4nJu67TIPYC20i4":
      return "semestral";
    case "price_1TTU5ZIxq4nJu67TBg2yZnBz":
      return "anual";
    default:
      return null;
  }
}

export const Route = createFileRoute("/api/public/webhook/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2025-02-24.acacia" as any,
        });
        const sig = request.headers.get("stripe-signature");
        const body = await request.text();

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            sig!,
            process.env.STRIPE_WEBHOOK_SECRET!,
          );
        } catch (err: any) {
          console.error("Webhook signature failed:", err.message);
          return new Response(`Webhook Error: ${err.message}`, { status: 400 });
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
                currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
              }

              await supabaseAdmin.from("assinaturas").upsert(
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
              const inv = event.data.object as Stripe.Invoice;
              const subId = inv.subscription as string | null;
              if (!subId) break;
              const sub = await stripe.subscriptions.retrieve(subId);
              const userId = sub.metadata?.user_id;
              if (!userId) break;
              await supabaseAdmin
                .from("assinaturas")
                .update({
                  status: "ativo",
                  current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                  plano: planoFromPriceId(sub.items.data[0]?.price.id),
                })
                .eq("user_id", userId);
              break;
            }
            case "invoice.payment_failed": {
              const inv = event.data.object as Stripe.Invoice;
              const subId = inv.subscription as string | null;
              if (!subId) break;
              await supabaseAdmin
                .from("assinaturas")
                .update({ status: "atrasado" })
                .eq("stripe_subscription_id", subId);
              break;
            }
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              await supabaseAdmin
                .from("assinaturas")
                .update({ status: "cancelado" })
                .eq("stripe_subscription_id", sub.id);
              break;
            }
            case "customer.subscription.updated": {
              const sub = event.data.object as Stripe.Subscription;
              const status =
                sub.status === "active" || sub.status === "trialing"
                  ? "ativo"
                  : sub.status === "past_due" || sub.status === "unpaid"
                    ? "atrasado"
                    : sub.status === "canceled"
                      ? "cancelado"
                      : sub.status;
              await supabaseAdmin
                .from("assinaturas")
                .update({
                  status,
                  current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                  plano: planoFromPriceId(sub.items.data[0]?.price.id),
                })
                .eq("stripe_subscription_id", sub.id);
              break;
            }
          }
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Webhook handler error:", err);
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      },
    },
  },
});
