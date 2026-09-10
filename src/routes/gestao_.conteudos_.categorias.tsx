import Admin from "@/pages/Admin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/conteudos_/categorias")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Admin fixedTab="recipeCategories" />,
});
