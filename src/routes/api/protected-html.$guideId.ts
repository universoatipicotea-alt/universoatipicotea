import { createFileRoute } from "@tanstack/react-router";

const headers = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'self' data: blob:; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src data: https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
};

export const Route = createFileRoute("/api/protected-html/$guideId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const guideId = Number(params.guideId);
        const token = new URL(request.url).searchParams.get("token") ?? "";
        if (!Number.isInteger(guideId) || guideId < 1 || !token)
          return new Response("Not found", { status: 404 });

        const [{ supabaseAdmin }, { verifyDriveMediaToken }, { bundledAcademyHtml }] = await Promise.all([
          import("@/integrations/supabase/client.server"),
          import("@/lib/drive-media-token.server"),
          import("@/content/academy/registry.server"),
        ]);
        if (!verifyDriveMediaToken(token, guideId)) return new Response("Not found", { status: 404 });

        const { data: guide } = await supabaseAdmin.from("ua_guides").select("id,status,content_type,html_key").eq("id", guideId).maybeSingle();
        if (!guide?.html_key || guide.content_type !== "html" || guide.status !== "published")
          return new Response("Not found", { status: 404 });

        const bundled = bundledAcademyHtml(guide.html_key);
        if (bundled) return new Response(bundled, { headers });

        const { data, error } = await supabaseAdmin.storage.from("guias-pdf").createSignedUrl(guide.html_key, 60);
        if (error || !data?.signedUrl) return new Response("Not found", { status: 404 });
        const upstream = await fetch(data.signedUrl);
        if (!upstream.ok) return new Response("Not found", { status: 404 });
        return new Response(await upstream.arrayBuffer(), { headers });
      },
    },
  },
});
