import Master from "@/pages/Master";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/plataforma_/acessos")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Master fixedView="accounts" />,
});
