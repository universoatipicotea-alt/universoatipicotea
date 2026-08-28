import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Master";

export const Route = createFileRoute("/master")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Master — Universo Atípico" },
      { name: "description", content: "Painel master: contas, produtos, campanhas e métricas." },
      { property: "og:title", content: "Master — Universo Atípico" },
      { property: "og:description", content: "Painel master: contas, produtos, campanhas e métricas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
