import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/conteudos_/academia")({
  beforeLoad: () => {
    throw redirect({ to: "/gestao/academia" });
  },
  component: () => null,
});
