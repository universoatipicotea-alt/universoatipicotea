import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";

export const Route = createFileRoute("/gestao_/lojamundoazul")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Admin fixedTab="facilitators" />,
});
