import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Academia";

export const Route = createFileRoute("/academia")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Academia — Universo Atípico" },
      {
        name: "description",
        content: "Área de estudo do Universo Atípico, disponível no acesso gratuito atual.",
      },
      { property: "og:title", content: "Academia — Universo Atípico" },
      {
        property: "og:description",
        content: "Área de estudo do Universo Atípico, disponível no acesso gratuito atual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
