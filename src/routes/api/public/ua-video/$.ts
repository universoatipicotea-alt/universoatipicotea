import { createFileRoute } from "@tanstack/react-router";

/**
 * Entrega o vídeo do funil VSL a partir do armazenamento privado.
 * Gera uma URL assinada de curta duração e faz proxy dos bytes,
 * garantindo Content-Type correto e suporte a Range (seek no player),
 * sem expor links permanentes do storage.
 */
export const Route = createFileRoute("/api/public/ua-video/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const key = (params as { _splat?: string })._splat ?? "";
        if (!key || key.includes("..")) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: funnel } = await supabaseAdmin
          .from("ua_funnel_settings")
          .select("vsl_video_path")
          .eq("id", 1)
          .maybeSingle();
        if (!funnel?.vsl_video_path || key !== funnel.vsl_video_path)
          return new Response("Not found", { status: 404 });
        const { data, error } = await supabaseAdmin.storage
          .from("funil-video")
          .createSignedUrl(key, 300);

        if (error || !data?.signedUrl) {
          console.error("[ua-video] signed url error:", error);
          return new Response("Not found", { status: 404 });
        }

        const headers = new Headers();
        const range = request.headers.get("range");
        if (range) headers.set("range", range);

        const upstream = await fetch(data.signedUrl, { headers });
        if (!upstream.ok && upstream.status !== 206) {
          console.error("[ua-video] upstream error:", upstream.status);
          return new Response("Not found", { status: 404 });
        }

        const responseHeaders = new Headers();
        responseHeaders.set("content-type", "video/mp4");
        responseHeaders.set("accept-ranges", "bytes");
        responseHeaders.set("cache-control", "private, max-age=300");
        for (const name of ["content-length", "content-range"]) {
          const value = upstream.headers.get(name);
          if (value) responseHeaders.set(name, value);
        }

        return new Response(upstream.body, {
          status: upstream.status,
          headers: responseHeaders,
        });
      },
    },
  },
});
