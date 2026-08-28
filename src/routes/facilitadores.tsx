import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Facilitators";

export const Route = createFileRoute("/facilitadores")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Facilitadores — Universo Atípico" },
      { name: "description", content: "Recursos e facilitadores selecionados para apoiar a jornada atípica." },
      { property: "og:title", content: "Facilitadores — Universo Atípico" },
      { property: "og:description", content: "Recursos e facilitadores selecionados para apoiar a jornada atípica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
