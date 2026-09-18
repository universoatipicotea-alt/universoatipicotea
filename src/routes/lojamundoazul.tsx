import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/pages/Storefront";

export const Route = createFileRoute("/lojamundoazul")({
  ssr: false,
  component: () => <Storefront />,
  head: () => ({
    meta: [
      { title: "Loja Mundo Azul — Universo Atípico" },
      {
        name: "description",
        content: "Produtos e recursos selecionados pelo Universo Atípico para o cotidiano.",
      },
      { property: "og:title", content: "Loja Mundo Azul — Universo Atípico" },
      { property: "og:type", content: "website" },
    ],
  }),
});
