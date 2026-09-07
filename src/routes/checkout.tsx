import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Checkout";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Checkout — Universo Atípico" },
      { name: "description", content: "Finalize sua assinatura da Academia Atípica." },
      { property: "og:title", content: "Checkout — Universo Atípico" },
      { property: "og:description", content: "Finalize sua assinatura da Academia Atípica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
