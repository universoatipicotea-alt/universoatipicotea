import { createFileRoute } from "@tanstack/react-router";
import VslPage from "@/pages/Vsl";

export const Route = createFileRoute("/vsl")({
  component: VslPage,
  head: () => ({
    meta: [
      { title: "Assista e descubra — Universo Atípico" },
      { name: "description", content: "Veja como a comunidade Universo Atípico pode acompanhar sua jornada com apoio, estratégias e materiais para famílias atípicas." },
      { property: "og:title", content: "Assista e descubra — Universo Atípico" },
      { property: "og:description", content: "Veja como a comunidade Universo Atípico pode acompanhar sua jornada com apoio, estratégias e materiais para famílias atípicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
