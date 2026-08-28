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

/**
 * Processa eventos de webhook do Stripe: garante a liberação do acesso mesmo
 * quando o redirecionamento do navegador falha depois do pagamento.
 */
export async function verifyStripeEvent(rawBody: string, signature: string | null) {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("Webhook não configurado.");
  if (!signature) throw new Error("Assinatura ausente.");
  const stripe = stripeClient();
  return stripe.webhooks.constructEventAsync(rawBody, signature, secret);
}

async function resolveAuthId(params: { authId?: string | null; email?: string | null }) {
  if (params.authId) return params.authId;
  if (!params.email) return null;
  const { data } = await db()
    .from("ua_users")
    .select("auth_id")
    .ilike("email", params.email)
    .maybeSingle();
  return (data?.auth_id as string | null) ?? null;
}

export async function handleStripeEvent(event: Stripe.Event) {
  const stripe = stripeClient();

  const applySubscription = async (subscription: Stripe.Subscription, sessionId?: string | null) => {
    let email: string | null = null;
    const customer = subscription.customer;
    const customerId = typeof customer === "string" ? customer : customer?.id;
    if (customerId) {
      try {
        const c = await stripe.customers.retrieve(customerId);
        if (c && !("deleted" in c && c.deleted)) email = (c as Stripe.Customer).email ?? null;
      } catch {
        // segue com metadata
      }
    }

    const authId = await resolveAuthId({
      authId: subscription.metadata?.["auth_id"] ?? null,
      email,
    });
    if (!authId) return { handled: false as const, reason: "usuário ainda não cadastrado" };

    const active = subscription.status === "active" || subscription.status === "trialing";
    const periodEndSeconds =
      (subscription as unknown as { current_period_end?: number }).current_period_end ??
      subscription.items.data[0]?.current_period_end ??
      null;

    const values = {
      user_id: authId,
      provider: "stripe",
      provider_subscription_id: subscription.id,
      provider_checkout_session_id: sessionId ?? null,
      status: active ? "active" : subscription.status,
      current_period_end: periodEndSeconds
        ? new Date(periodEndSeconds * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await db()
      .from("subscriptions")
      .select("id")
      .eq("provider_subscription_id", subscription.id)
      .maybeSingle();

    if (existing?.id) await db().from("subscriptions").update(values).eq("id", existing.id);
    else await db().from("subscriptions").insert(values);

    await db()
      .from("ua_users")
      .update({ membership_status: active ? "member" : "visitor" })
      .eq("auth_id", authId);

    return { handled: true as const, active };
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!subId) return { handled: false as const, reason: "sessão sem assinatura" };
      const subscription = await stripe.subscriptions.retrieve(subId);
      return applySubscription(subscription, session.id);
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const object = event.data.object as Stripe.Subscription | Stripe.Invoice;
      let subscription: Stripe.Subscription | null = null;
      if ("object" in object && object.object === "subscription") {
        subscription = object as Stripe.Subscription;
      } else {
        const invoice = object as Stripe.Invoice;
        const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription })
          .subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (subId) subscription = await stripe.subscriptions.retrieve(subId);
      }
      if (!subscription) return { handled: false as const, reason: "evento sem assinatura" };
      return applySubscription(subscription);
    }
    default:
      return { handled: false as const, reason: "evento ignorado" };
  }
}
