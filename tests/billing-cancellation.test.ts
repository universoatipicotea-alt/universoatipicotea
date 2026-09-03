import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type Stripe from "stripe";
import {
  setStripePeriodEndCancellation,
  stripeEventIsOlder,
  subscriptionAccessIsActive,
  subscriptionPeriodEnd,
  type StripeSubscriptionGateway,
} from "../src/lib/subscription-lifecycle.ts";

function subscription(overrides: Partial<Stripe.Subscription> = {}) {
  return {
    id: "sub_test_123",
    object: "subscription",
    status: "active",
    cancel_at_period_end: false,
    metadata: { auth_id: "auth-test-1" },
    items: { data: [{ current_period_end: 1_800_000_000 }] },
    ...overrides,
  } as Stripe.Subscription;
}

function gateway(initial: Stripe.Subscription) {
  let current = initial;
  const updates: Array<{ cancelAtPeriodEnd: boolean; idempotencyKey: string }> = [];
  const api: StripeSubscriptionGateway = {
    async retrieve() {
      return current;
    },
    async update(_id, params, options) {
      updates.push({
        cancelAtPeriodEnd: Boolean(params.cancel_at_period_end),
        idempotencyKey: options.idempotencyKey,
      });
      current = { ...current, cancel_at_period_end: Boolean(params.cancel_at_period_end) };
      return current;
    },
  };
  return { api, updates };
}

test("agenda cancelamento no fim do período sem encerrar imediatamente", async () => {
  const fake = gateway(subscription());
  const result = await setStripePeriodEndCancellation(
    fake.api,
    "sub_test_123",
    true,
    "auth-test-1",
  );
  assert.equal(result.changed, true);
  assert.equal(result.subscription.status, "active");
  assert.equal(result.subscription.cancel_at_period_end, true);
  assert.equal(fake.updates.length, 1);
  assert.match(fake.updates[0]!.idempotencyKey, /^ua-cancel-sub_test_123-/);
});

test("não repete alteração quando cancelamento já está agendado", async () => {
  const fake = gateway(subscription({ cancel_at_period_end: true }));
  const result = await setStripePeriodEndCancellation(
    fake.api,
    "sub_test_123",
    true,
    "auth-test-1",
  );
  assert.equal(result.changed, false);
  assert.equal(fake.updates.length, 0);
});

test("permite desistir do cancelamento antes do fim do período", async () => {
  const fake = gateway(subscription({ cancel_at_period_end: true }));
  const result = await setStripePeriodEndCancellation(
    fake.api,
    "sub_test_123",
    false,
    "auth-test-1",
  );
  assert.equal(result.changed, true);
  assert.equal(result.subscription.cancel_at_period_end, false);
  assert.match(fake.updates[0]!.idempotencyKey, /^ua-resume-sub_test_123-/);
});

test("bloqueia assinatura associada a outro usuário antes de alterar", async () => {
  const fake = gateway(subscription({ metadata: { auth_id: "outra-conta" } }));
  await assert.rejects(
    setStripePeriodEndCancellation(fake.api, "sub_test_123", true, "auth-test-1"),
    /não pertence/,
  );
  assert.equal(fake.updates.length, 0);
});

test("acesso respeita status e fim do período", () => {
  const active = subscription();
  assert.equal(subscriptionPeriodEnd(active), "2027-01-15T08:00:00.000Z");
  assert.equal(subscriptionAccessIsActive(active, new Date("2026-09-03T12:00:00Z")), true);
  assert.equal(subscriptionAccessIsActive(active, new Date("2028-01-01T00:00:00Z")), false);
  assert.equal(subscriptionAccessIsActive(subscription({ status: "canceled" })), false);
});

test("ignora webhook estritamente mais antigo que o último aplicado", () => {
  assert.equal(stripeEventIsOlder("2026-09-03T12:00:01.000Z", 1_788_436_800), true);
  assert.equal(stripeEventIsOlder("2026-09-03T12:00:00.000Z", 1_788_436_800), false);
  assert.equal(stripeEventIsOlder(null, 1_788_436_800), false);
});

test("ledger de webhook é idempotente, protegido por RLS e reversível", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260903200000_add_stripe_webhook_idempotency.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /event_id text PRIMARY KEY/);
  assert.match(migration, /claim_ua_stripe_webhook_event/);
  assert.match(migration, /ON CONFLICT \(event_id\) DO NOTHING/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /last_stripe_event_created_at/);
  assert.doesNotMatch(migration, /^(DELETE\s+FROM|TRUNCATE|DROP\s+TABLE)/im);
});

test("configuração Stripe declara IDs sem valores no exemplo", () => {
  const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(envExample, /^STRIPE_PRICE_ID=$/m);
  assert.match(envExample, /^STRIPE_PRODUCT_ID=$/m);
});
