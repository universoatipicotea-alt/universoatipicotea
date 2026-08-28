import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/AcademiaLanding";

export const Route = createFileRoute("/academia-atipica")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Academia Atípica — Universo Atípico" },
      { name: "description", content: "Conteúdo aprofundado, trilhas guiadas e materiais especiais da Academia Atípica." },
      { property: "og:title", content: "Academia Atípica — Universo Atípico" },
      { property: "og:description", content: "Conteúdo aprofundado, trilhas guiadas e materiais especiais da Academia Atípica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
