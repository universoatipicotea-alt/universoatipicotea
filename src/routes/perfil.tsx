import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Profile";

export const Route = createFileRoute("/perfil")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Meu perfil — Universo Atípico" },
      { name: "description", content: "Atualize seus dados, preferências e foto de perfil." },
      { property: "og:title", content: "Meu perfil — Universo Atípico" },
      { property: "og:description", content: "Atualize seus dados, preferências e foto de perfil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
