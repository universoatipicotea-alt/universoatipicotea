import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Receitas";

export const Route = createFileRoute("/receitas_/$categoria")({
  ssr: false,
  component: ReceitaCategoryPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.categoria} — Receitas | Universo Atípico` },
      { name: "description", content: "Receitas organizadas por categoria para rotinas reais." },
    ],
  }),
});

function ReceitaCategoryPage() {
  const { categoria } = Route.useParams();
  return <Page categorySlug={categoria} />;
}
