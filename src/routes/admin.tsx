import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Administração — Universo Atípico" },
      { name: "description", content: "Painel de administração de conteúdo e moderação da comunidade." },
      { property: "og:title", content: "Administração — Universo Atípico" },
      { property: "og:description", content: "Painel de administração de conteúdo e moderação da comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
