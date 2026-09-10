import Admin from "@/pages/Admin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/comunidade_/moderacao")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Admin fixedTab="moderation" />,
});
