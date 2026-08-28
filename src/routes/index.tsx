import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Universo Atípico — comunidade e conhecimento para jornadas atípicas" },
      { name: "description", content: "Comunidade gratuita, biblioteca de guias e Academia Atípica: apoio, conhecimento e companhia para famílias e profissionais em jornadas atípicas." },
      { property: "og:title", content: "Universo Atípico — comunidade e conhecimento para jornadas atípicas" },
      { property: "og:description", content: "Comunidade gratuita, biblioteca de guias e Academia Atípica: apoio, conhecimento e companhia para famílias e profissionais em jornadas atípicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
