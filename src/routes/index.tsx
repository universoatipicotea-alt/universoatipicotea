import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Universo Atípico — conhecimento, recursos e comunidade" },
      {
        name: "description",
        content:
          "Ecossistema de conhecimento, experiências, pessoas e soluções para quem vive a realidade atípica. Acesso gratuito nesta fase.",
      },
      { property: "og:title", content: "Universo Atípico — conhecimento, recursos e comunidade" },
      {
        property: "og:description",
        content:
          "Ecossistema de conhecimento, experiências, pessoas e soluções para quem vive a realidade atípica. Acesso gratuito nesta fase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
