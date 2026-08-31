import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Auth";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Entrar — Universo Atípico" },
      { name: "description", content: "Entre na sua conta do Universo Atípico e continue seus conteúdos, biblioteca e comunidade." },
      { property: "og:title", content: "Entrar — Universo Atípico" },
      { property: "og:description", content: "Entre na sua conta do Universo Atípico e continue seus conteúdos, biblioteca e comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
