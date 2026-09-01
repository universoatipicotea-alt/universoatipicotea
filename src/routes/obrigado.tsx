import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Obrigado";

export const Route = createFileRoute("/obrigado")({
  ssr: false,
  component: Page,
  head: () => ({
    meta: [
      { title: "Pagamento confirmado — Universo Atípico" },
      {
        name: "description",
        content:
          "Confirmação da sua assinatura do Universo Atípico e criação do acesso de membro.",
      },
      { property: "og:title", content: "Pagamento confirmado — Universo Atípico" },
      {
        property: "og:description",
        content:
          "Confirmação da sua assinatura do Universo Atípico e criação do acesso de membro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
