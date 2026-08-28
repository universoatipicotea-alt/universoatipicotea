/**
 * Integração de cobrança com Stripe (assinatura mensal do Plano Universo).
 * Executa apenas no servidor.
 */
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const STRIPE_PRICE_ID = "price_1U9XZnAk4sFyKMbpUTqwkwoZ";
export const STRIPE_PRODUCT_ID = "prod_V9rIuXcogHQYY6";

function stripeClient() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Pagamento indisponível no momento. Tente novamente mais tarde.");
  return new Stripe(key, { apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion });
}

const db = () => supabaseAdmin as any;

async function findCustomerId(stripe: Stripe, email: string) {
  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data[0]?.id;
}

export async function createCheckoutSession(params: {
  authId?: string | null;
  email?: string | null;
  name?: string | null;
  origin: string;
}) {
  const stripe = stripeClient();
  const customerId = params.email ? await findCustomerId(stripe, params.email) : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(customerId
      ? { customer: customerId }
      : params.email
        ? { customer_email: params.email }
        : {}),
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    ...(params.authId
      ? {
          client_reference_id: params.authId,
          metadata: { auth_id: params.authId },
          subscription_data: { metadata: { auth_id: params.authId } },
        }
      : {}),
    allow_promotion_codes: true,
    locale: "pt-BR",
    success_url: `${params.origin}/checkout?status=sucesso&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/checkout?status=cancelado`,
  });

  if (!session.url) throw new Error("Não foi possível iniciar o pagamento. Tente novamente.");
  return { url: session.url, sessionId: session.id };
}

/**
 * Dados públicos de uma sessão de checkout: usado para pré-preencher o cadastro
 * feito após o pagamento.
 */
export async function getCheckoutSessionInfo(sessionId: string) {
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const email =
    session.customer_details?.email ?? (session.customer_email as string | null) ?? null;
  return {
    email,
    paid: session.payment_status === "paid" || session.status === "complete",
  };
}


/**
 * Lê o estado real no Stripe e sincroniza a tabela `subscriptions`.
 */
export async function syncSubscription(params: {
  authId: string;
  email: string | null;
  sessionId?: string | null;
}) {
  const stripe = stripeClient();

  let subscription: Stripe.Subscription | null = null;
  let checkoutSessionId: string | null = params.sessionId ?? null;

  if (params.sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(params.sessionId, {
        expand: ["subscription"],
      });
      const sub = session.subscription;
      if (sub && typeof sub !== "string") subscription = sub;
      else if (typeof sub === "string") subscription = await stripe.subscriptions.retrieve(sub);
    } catch {
      // sessão inválida: cai no fallback por e-mail
    }
  }

  if (!subscription && params.email) {
    const customerId = await findCustomerId(stripe, params.email);
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
      subscription =
        subs.data.find((s) => s.status === "active" || s.status === "trialing") ??
        subs.data[0] ??
        null;
    }
  }

  if (!subscription) return { active: false as const, status: "none" };

  const active = subscription.status === "active" || subscription.status === "trialing";
  const periodEndSeconds =
    (subscription as unknown as { current_period_end?: number }).current_period_end ??
    subscription.items.data[0]?.current_period_end ??
    null;
  const currentPeriodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null;

  const { data: existing } = await db()
    .from("subscriptions")
    .select("id")
    .eq("user_id", params.authId)
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle();

  const values = {
    user_id: params.authId,
    provider: "stripe",
    provider_subscription_id: subscription.id,
    provider_checkout_session_id: checkoutSessionId,
    status: active ? "active" : subscription.status,
    current_period_end: currentPeriodEnd,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) await db().from("subscriptions").update(values).eq("id", existing.id);
  else await db().from("subscriptions").insert(values);

  if (active) {
    await db().from("ua_users").update({ membership_status: "member" }).eq("auth_id", params.authId);
  }

  return { active, status: subscription.status, currentPeriodEnd };
}

export async function createPortalSession(params: { email: string | null; origin: string }) {
  if (!params.email) throw new Error("Sua conta precisa de um e-mail válido.");
  const stripe = stripeClient();
  const customerId = await findCustomerId(stripe, params.email);
  if (!customerId) throw new Error("Nenhuma assinatura encontrada para esta conta.");
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${params.origin}/minha-assinatura`,
  });
  return { url: portal.url };
}
