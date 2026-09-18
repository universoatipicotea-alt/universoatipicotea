import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/pages/Storefront";

export const Route = createFileRoute("/lojamundoazul_/produto_/$slug")({
  ssr: false,
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Loja Mundo Azul` },
      {
        name: "description",
        content: "Produto selecionado pela Loja Mundo Azul, do Universo Atípico.",
      },
    ],
  }),
});
function ProductPage() {
  const { slug } = Route.useParams();
  return <Storefront slug={slug} />;
}
