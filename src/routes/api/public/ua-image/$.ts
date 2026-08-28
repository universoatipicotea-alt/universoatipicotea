import { createFileRoute } from "@tanstack/react-router";

/**
 * Entrega as imagens de capa e avatares guardados no armazenamento privado.
 * Só serve imagens: nenhum PDF ou arquivo sensível passa por aqui.
 */
export const Route = createFileRoute("/api/public/ua-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = (params as { _splat?: string })._splat ?? "";
        if (!key || key.includes("..")) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("guias-capas").download(key);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
