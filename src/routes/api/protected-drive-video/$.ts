import { createFileRoute } from "@tanstack/react-router";

/**
 * Faz proxy de vídeos mantidos no Drive sem expor o ID como URL pública permanente.
 * O token curto é emitido somente depois da autorização de acesso ao guia no backend.
 */
export const Route = createFileRoute("/api/protected-drive-video/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const rawGuideId = (params as { _splat?: string })._splat ?? "";
        const guideId = Number(rawGuideId);
        const token = new URL(request.url).searchParams.get("token") ?? "";
        if (!Number.isInteger(guideId) || guideId < 1 || !token)
          return new Response("Not found", { status: 404 });

        const [{ supabaseAdmin }, { GoogleDriveReadClient, verifyDriveMediaToken }] =
          await Promise.all([
            import("@/integrations/supabase/client.server"),
            import("@/lib/drive-import.server"),
          ]);
        if (!verifyDriveMediaToken(token, guideId))
          return new Response("Not found", { status: 404 });

        const { data: guide } = await supabaseAdmin
          .from("ua_guides")
          .select("id,content_type,video_url")
          .eq("id", guideId)
          .maybeSingle();
        const videoUrl = guide?.video_url ?? "";
        if (guide?.content_type !== "video" || !videoUrl.startsWith("drive:"))
          return new Response("Not found", { status: 404 });
        const driveFileId = videoUrl.slice("drive:".length);
        if (!/^[a-zA-Z0-9_-]{10,}$/.test(driveFileId))
          return new Response("Not found", { status: 404 });

        try {
          const client = new GoogleDriveReadClient();
          const upstream = await client.downloadResponse(driveFileId, request.headers.get("range"));
          const headers = new Headers({
            "accept-ranges": "bytes",
            "cache-control": "private, no-store",
            "content-security-policy": "default-src 'none'",
            "x-content-type-options": "nosniff",
          });
          headers.set(
            "content-type",
            upstream.headers.get("content-type") || "application/octet-stream",
          );
          for (const name of ["content-length", "content-range"]) {
            const value = upstream.headers.get(name);
            if (value) headers.set(name, value);
          }
          return new Response(upstream.body, { status: upstream.status, headers });
        } catch (error) {
          console.error("[protected-drive-video] upstream error", error);
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
