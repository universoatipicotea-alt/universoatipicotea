import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Universo Atípico — comunidade e conhecimento para jornadas atípicas" },
      { name: "description", content: "Ecossistema de conhecimento, experiências, pessoas e soluções para quem vive a realidade atípica. Assinatura de R$ 49,90/mês com acesso completo." },
      { property: "og:title", content: "Universo Atípico — comunidade e conhecimento para jornadas atípicas" },
      { property: "og:description", content: "Ecossistema de conhecimento, experiências, pessoas e soluções para quem vive a realidade atípica. Assinatura de R$ 49,90/mês com acesso completo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
