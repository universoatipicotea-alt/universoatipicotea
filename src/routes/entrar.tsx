import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Auth";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Entrar — Universo Atípico" },
      { name: "description", content: "Acesse sua conta do Universo Atípico ou crie a sua para ativar a assinatura de R$ 49,90/mês." },
      { property: "og:title", content: "Entrar — Universo Atípico" },
      { property: "og:description", content: "Acesse sua conta do Universo Atípico ou crie a sua para ativar a assinatura de R$ 49,90/mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
