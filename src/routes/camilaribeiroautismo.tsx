import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CamilaRibeiroAutismo";

export const Route = createFileRoute("/camilaribeiroautismo")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Camila Ribeiro Autismo | Links" },
      {
        name: "description",
        content:
          "Links, conteúdos, comunidades e projetos compartilhados por Camila Ribeiro Autismo.",
      },
      { property: "og:title", content: "Camila Ribeiro Autismo | Links" },
      {
        property: "og:description",
        content:
          "Links, conteúdos, comunidades e projetos compartilhados por Camila Ribeiro Autismo.",
      },
      {
        property: "og:image",
        content: "/manus-storage/universo-atipico-logo-oficial_05f4c9c6.png",
      },
    ],
  }),
});
