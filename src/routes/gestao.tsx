import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ManagementHub";

export const Route = createFileRoute("/gestao")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Gestão — Universo Atípico" },
      { name: "description", content: "Backoffice administrativo do Universo Atípico." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
