import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/conteudos_/receitas")({
  beforeLoad: () => {
    throw redirect({ to: "/gestao/receitas" });
  },
  component: () => null,
});
