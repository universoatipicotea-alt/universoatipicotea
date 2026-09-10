import { createFileRoute } from "@tanstack/react-router";
import ManagementSection from "@/pages/ManagementSection";

export const Route = createFileRoute("/gestao_/comunidade")({
  ssr: false,
  component: () => <ManagementSection area="comunidade" />,
  head: () => ({
    meta: [
      { title: "Comunidade e clientes — Gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
