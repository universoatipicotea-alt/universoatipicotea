import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/NovaSenha";

export const Route = createFileRoute("/nova-senha")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Nova senha — Universo Atípico" },
      { name: "description", content: "Crie uma nova senha para voltar a acessar sua conta do Universo Atípico." },
      { property: "og:title", content: "Nova senha — Universo Atípico" },
      { property: "og:description", content: "Crie uma nova senha para voltar a acessar sua conta do Universo Atípico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
