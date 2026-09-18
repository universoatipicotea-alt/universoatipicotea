import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/pages/Storefront";

export const Route = createFileRoute("/lojamundoazul_/membros")({
  ssr: false,
  component: () => <Storefront members />,
  head: () => ({
    meta: [
      { title: "Loja Mundo Azul — Área de membros" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
