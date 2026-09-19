import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/facilitadores")({
  ssr: false,
  component: () => <Navigate to="/lojamundoazul/membros" replace />,
  head: () => ({
    meta: [
      { title: "Loja Mundo Azul — Universo Atípico" },
      { name: "description", content: "Produtos e recursos selecionados pela Loja Mundo Azul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
