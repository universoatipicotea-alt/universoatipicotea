import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/conteudos_/aulas")({
  beforeLoad: () => {
    throw redirect({ to: "/gestao/academia/aulas" });
  },
  component: () => null,
});
