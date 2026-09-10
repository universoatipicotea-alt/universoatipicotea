import Master from "@/pages/Master";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao_/conteudos_/importacao")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Master fixedView="driveImport" />,
});
