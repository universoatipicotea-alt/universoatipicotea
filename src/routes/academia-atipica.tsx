import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A landing antiga `/academia-atipica` foi unificada com a home.
 * Preservamos o path com redirecionamento permanente para não quebrar
 * links já divulgados em redes sociais, anúncios ou mensagens.
 */
export const Route = createFileRoute("/academia-atipica")({
  loader: () => redirect({ to: "/", statusCode: 301 }),
});
