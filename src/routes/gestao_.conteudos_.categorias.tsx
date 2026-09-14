import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/conteudos_/categorias")({
  beforeLoad: () => {
    throw redirect({ to: "/gestao/receitas/categorias" });
  },
  component: () => null,
});
