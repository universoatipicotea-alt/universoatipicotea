import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/inicio")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Início — Universo Atípico" },
      { name: "description", content: "Sua porta de entrada no Universo Atípico: guias, comunidade e recursos para o dia a dia." },
      { property: "og:title", content: "Início — Universo Atípico" },
      { property: "og:description", content: "Sua porta de entrada no Universo Atípico: guias, comunidade e recursos para o dia a dia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
