import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Forum";

export const Route = createFileRoute("/comunidade")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Comunidade — Universo Atípico" },
      { name: "description", content: "Conversas, respostas e trocas cuidadosas entre famílias." },
      { property: "og:title", content: "Comunidade — Universo Atípico" },
      {
        property: "og:description",
        content: "Conversas, respostas e trocas cuidadosas entre famílias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
