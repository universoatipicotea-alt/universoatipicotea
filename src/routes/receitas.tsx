import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Receitas";

export const Route = createFileRoute("/receitas")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Receitas — Universo Atípico" },
      { name: "description", content: "Receitas saudáveis e criativas pensadas para rotinas atípicas." },
      { property: "og:title", content: "Receitas — Universo Atípico" },
      { property: "og:description", content: "Receitas saudáveis e criativas pensadas para rotinas atípicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
