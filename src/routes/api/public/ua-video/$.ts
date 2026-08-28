import { createFileRoute } from "@tanstack/react-router";

/**
 * Entrega o vídeo do funil VSL a partir do armazenamento privado.
 * Gera uma URL assinada de curta duração e redireciona para ela,
 * evitando expor links permanentes do storage.
 */
export const Route = createFileRoute("/api/public/ua-video/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = (params as { _splat?: string })._splat ?? "";
        if (!key || key.includes("..")) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("funil-video")
          .createSignedUrl(key, 300);

        if (error || !data?.signedUrl) {
          console.error("[ua-video] signed url error:", error);
          return new Response("Not found", { status: 404 });
        }

        return Response.redirect(data.signedUrl, 302);
      },
    },
  },
});
