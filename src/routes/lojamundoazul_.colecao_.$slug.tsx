import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/pages/Storefront";

export const Route = createFileRoute("/lojamundoazul_/colecao_/$slug")({
  ssr: false,
  component: CollectionPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Loja Mundo Azul` },
      {
        name: "description",
        content: "Coleção da Loja Mundo Azul, uma vertical do Universo Atípico.",
      },
    ],
  }),
});
function CollectionPage() {
  const { slug } = Route.useParams();
  return <Storefront collection={slug} />;
}
