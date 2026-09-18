import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/comunidade_/facilitadores")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Navigate to="/gestao/lojamundoazul" replace />,
});
