import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ProductRedirect";

export const Route = createFileRoute("/produto/$slug")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Indicação — Universo Atípico" },
      { name: "description", content: "Você está sendo redirecionado para uma indicação do Universo Atípico." },
      { property: "og:title", content: "Indicação — Universo Atípico" },
      { property: "og:description", content: "Você está sendo redirecionado para uma indicação do Universo Atípico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
