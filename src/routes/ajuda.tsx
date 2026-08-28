import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Help";

export const Route = createFileRoute("/ajuda")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Ajuda — Universo Atípico" },
      { name: "description", content: "Dúvidas frequentes e suporte do Universo Atípico." },
      { property: "og:title", content: "Ajuda — Universo Atípico" },
      { property: "og:description", content: "Dúvidas frequentes e suporte do Universo Atípico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
