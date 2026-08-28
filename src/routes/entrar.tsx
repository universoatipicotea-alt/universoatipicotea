import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Auth";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Entrar — Universo Atípico" },
      { name: "description", content: "Acesse ou crie sua conta gratuita para participar da comunidade Universo Atípico." },
      { property: "og:title", content: "Entrar — Universo Atípico" },
      { property: "og:description", content: "Acesse ou crie sua conta gratuita para participar da comunidade Universo Atípico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
