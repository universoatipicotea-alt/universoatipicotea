import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Community";

export const Route = createFileRoute("/comunidade")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Comunidade — Universo Atípico" },
      { name: "description", content: "Seu painel na comunidade: guias, facilitadores e conversas recentes." },
      { property: "og:title", content: "Comunidade — Universo Atípico" },
      { property: "og:description", content: "Seu painel na comunidade: guias, facilitadores e conversas recentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
