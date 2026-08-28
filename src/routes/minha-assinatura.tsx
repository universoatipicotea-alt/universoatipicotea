import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MinhaAssinatura";

export const Route = createFileRoute("/minha-assinatura")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Minha assinatura — Universo Atípico" },
      { name: "description", content: "Gerencie sua assinatura e seu acesso à Academia Atípica." },
      { property: "og:title", content: "Minha assinatura — Universo Atípico" },
      { property: "og:description", content: "Gerencie sua assinatura e seu acesso à Academia Atípica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
