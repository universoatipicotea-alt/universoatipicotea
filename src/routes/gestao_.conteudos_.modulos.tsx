import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/conteudos_/modulos")({
  beforeLoad: () => {
    throw redirect({ to: "/gestao/academia/modulos" });
  },
  component: () => null,
});
