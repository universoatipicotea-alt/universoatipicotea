import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        const rawBody = await request.text();

        const { verifyStripeEvent, handleStripeEvent } = await import("@/lib/billing.server");

        let event;
        try {
          event = await verifyStripeEvent(rawBody, signature);
        } catch (error) {
          console.error("[stripe-webhook] assinatura inválida", (error as Error).message);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          const result = await handleStripeEvent(event);
          console.log("[stripe-webhook]", event.type, JSON.stringify(result));
          return Response.json({ received: true, ...result });
        } catch (error) {
          console.error("[stripe-webhook] erro ao processar", event.type, error);
          // 500 faz o Stripe tentar novamente
          return new Response("Processing error", { status: 500 });
        }
      },
    },
  },
});
