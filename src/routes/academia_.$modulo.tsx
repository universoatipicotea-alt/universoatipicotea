import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Academia";

export const Route = createFileRoute("/academia_/$modulo")({
  ssr: false,
  component: AcademiaModulePage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.modulo} — Academia | Universo Atípico` },
      { name: "description", content: "Conteúdos da Academia Atípica organizados por módulo." },
    ],
  }),
});

function AcademiaModulePage() {
  const { modulo } = Route.useParams();
  return <Page moduleSlug={modulo} />;
}
