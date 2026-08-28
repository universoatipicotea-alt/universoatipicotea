import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Library";

export const Route = createFileRoute("/biblioteca")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Biblioteca — Universo Atípico" },
      { name: "description", content: "Guias práticos e materiais gratuitos para o dia a dia de famílias atípicas." },
      { property: "og:title", content: "Biblioteca — Universo Atípico" },
      { property: "og:description", content: "Guias práticos e materiais gratuitos para o dia a dia de famílias atípicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
