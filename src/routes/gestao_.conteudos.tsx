import { createFileRoute } from "@tanstack/react-router";
import ManagementSection from "@/pages/ManagementSection";

export const Route = createFileRoute("/gestao_/conteudos")({
  ssr: false,
  component: () => <ManagementSection area="conteudos" />,
  head: () => ({
    meta: [
      { title: "Conteúdo e produtos — Gestão" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
