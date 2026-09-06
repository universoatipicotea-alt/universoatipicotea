import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/forum")({
  loader: () => redirect({ to: "/comunidade", statusCode: 301 }),
});
