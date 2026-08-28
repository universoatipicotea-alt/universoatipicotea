import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Forum";

export const Route = createFileRoute("/forum")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Fórum — Universo Atípico" },
      { name: "description", content: "Conversas, dúvidas e trocas entre famílias e profissionais." },
      { property: "og:title", content: "Fórum — Universo Atípico" },
      { property: "og:description", content: "Conversas, dúvidas e trocas entre famílias e profissionais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
