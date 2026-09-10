import { createFileRoute } from "@tanstack/react-router";
import ManagementSection from "@/pages/ManagementSection";

export const Route = createFileRoute("/gestao_/plataforma")({
  ssr: false,
  component: () => <ManagementSection area="plataforma" />,
  head: () => ({
    meta: [
      { title: "Plataforma e segurança — Gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
