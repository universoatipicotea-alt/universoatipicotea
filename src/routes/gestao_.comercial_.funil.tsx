import Master from "@/pages/Master";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/comercial_/funil")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Master fixedView="overview" />,
});
