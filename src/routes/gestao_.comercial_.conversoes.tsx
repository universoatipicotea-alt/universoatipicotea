import Master from "@/pages/Master";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/comercial_/conversoes")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Master fixedView="conversions" />,
});
