import { createFileRoute } from "@tanstack/react-router";
import ManagementSection from "@/pages/ManagementSection";

export const Route = createFileRoute("/gestao_/comercial")({
  ssr: false,
  component: () => <ManagementSection area="comercial" />,
  head: () => ({
    meta: [
      { title: "Comercial e vendas — Gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
