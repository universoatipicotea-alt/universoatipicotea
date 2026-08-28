import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Assinatura";

export const Route = createFileRoute("/assinatura")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Assinatura — Universo Atípico" },
      { name: "description", content: "Conheça os planos e o que está incluído na Academia Atípica." },
      { property: "og:title", content: "Assinatura — Universo Atípico" },
      { property: "og:description", content: "Conheça os planos e o que está incluído na Academia Atípica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
