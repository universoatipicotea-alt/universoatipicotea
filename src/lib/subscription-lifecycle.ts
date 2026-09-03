import type Stripe from "stripe";

export type StripeSubscriptionGateway = {
  retrieve(id: string): Promise<Stripe.Subscription>;
  update(
    id: string,
    params: Stripe.SubscriptionUpdateParams,
    options: { idempotencyKey: string },
  ): Promise<Stripe.Subscription>;
};

export function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const seconds =
    (subscription as unknown as { current_period_end?: number }).current_period_end ??
    subscription.items.data[0]?.current_period_end ??
    null;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export function subscriptionAccessIsActive(subscription: Stripe.Subscription, now = new Date()) {
  if (!["active", "trialing"].includes(subscription.status)) return false;
  const periodEnd = subscriptionPeriodEnd(subscription);
  return !periodEnd || new Date(periodEnd).getTime() > now.getTime();
}

export function stripeEventIsOlder(lastEventCreatedAt: string | null, eventCreated: number) {
  if (!lastEventCreatedAt) return false;
  return new Date(lastEventCreatedAt).getTime() > eventCreated * 1000;
}

export async function setStripePeriodEndCancellation(
  gateway: StripeSubscriptionGateway,
  subscriptionId: string,
  cancelAtPeriodEnd: boolean,
  expectedAuthId?: string,
) {
  const current = await gateway.retrieve(subscriptionId);
  if (
    expectedAuthId &&
    current.metadata?.["auth_id"] &&
    current.metadata["auth_id"] !== expectedAuthId
  )
    throw new Error("A assinatura não pertence a esta conta.");
  if (current.status === "canceled") throw new Error("Esta assinatura já foi encerrada.");
  if (current.cancel_at_period_end === cancelAtPeriodEnd) {
    return { subscription: current, changed: false as const };
  }
  const periodKey = subscriptionPeriodEnd(current)?.slice(0, 10) ?? "no-period";
  const operation = cancelAtPeriodEnd ? "cancel" : "resume";
  const subscription = await gateway.update(
    subscriptionId,
    { cancel_at_period_end: cancelAtPeriodEnd },
    { idempotencyKey: `ua-${operation}-${subscriptionId}-${periodKey}` },
  );
  return { subscription, changed: true as const };
}
