import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveVisualAssetSources } from "../src/lib/visual-assets.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("variantes responsivas aplicam mobile para tablet para desktop", () => {
  assert.deepEqual(
    resolveVisualAssetSources({
      desktopImageUrl: "/desktop.webp",
      tabletImageUrl: "/tablet.webp",
      altText: "Banner acessível",
    }),
    {
      desktop: "/desktop.webp",
      tablet: "/tablet.webp",
      mobile: "/tablet.webp",
      altText: "Banner acessível",
    },
  );

  assert.deepEqual(
    resolveVisualAssetSources(
      { desktopImageUrl: "/novo-desktop.webp" },
      {
        desktopImageUrl: "/local-desktop.webp",
        tabletImageUrl: "/local-tablet.webp",
        mobileImageUrl: "/local-mobile.webp",
        altText: "Fallback local",
      },
    ),
    {
      desktop: "/novo-desktop.webp",
      tablet: "/novo-desktop.webp",
      mobile: "/novo-desktop.webp",
      altText: "Fallback local",
    },
  );
});

test("migration evolui a infraestrutura existente sem criar tabela paralela", () => {
  const migration = read("supabase/migrations/20260908030000_enhance_ua_banners.sql");
  assert.match(migration, /ALTER TABLE public\.ua_banners/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.ua_banners FROM anon, authenticated/);
  assert.match(migration, /GRANT ALL ON TABLE public\.ua_banners TO service_role/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS is_active/);
  assert.match(migration, /ua_banners_touch_updated_at/);
  assert.match(migration, /DROP TRIGGER IF EXISTS ua_banners_touch/);
  assert.doesNotMatch(migration, /EXECUTE FUNCTION public\.touch_updated_at/);
  assert.doesNotMatch(migration, /CREATE TABLE[^;]*ua_visual_assets/i);
  assert.doesNotMatch(migration, /^(?!\s*--).*\b(?:TRUNCATE|DROP\s+TABLE)\b/im);
});

test("backend expõe leitura pública mínima e restringe escrita ao Admin Master", () => {
  const server = read("src/lib/community.server.ts");
  const publicStart = server.indexOf('case "community.visualAssets.active"');
  assert.notEqual(publicStart, -1);
  assert.match(server.slice(publicStart, publicStart + 260), /listVisualAssets\(true\)/);
  assert.match(
    server,
    /VISUAL_ASSET_PUBLIC_COLUMNS\s*=\s*[\s\S]*slot,desktop_image_url:desktop_url,tablet_image_url:tablet_url,mobile_image_url:mobile_url,alt_text/,
  );
  assert.match(server, /\.eq\("is_active", true\)/);

  for (const route of ["community.master.visualAssets", "community.master.saveVisualAsset"]) {
    const start = server.indexOf(`case "${route}"`);
    assert.notEqual(start, -1);
    assert.match(server.slice(start, start + 380), /requireMaster\(\)/);
  }
  assert.match(server, /auditEvent\([\s\S]*"visual_asset"/);
  assert.match(server, /IMAGE_UPLOAD_MIME_TYPES/);
  assert.match(server, /MAX_IMAGE_UPLOAD_BYTES/);
  assert.match(server, /hasExpectedFileSignature/);
  const imageRoute = read("src/routes/api/public/ua-image/$.ts");
  assert.match(imageRoute, /x-content-type-options/);
  assert.match(imageRoute, /nosniff/);
  assert.match(imageRoute, /content-security-policy/);
});

test("Admin Master reutiliza upload e oferece preview, alt e três variantes", () => {
  const admin = read("src/components/admin/VisualAssetsAdmin.tsx");
  const master = read("src/pages/Master.tsx");
  assert.match(admin, /community\.files\.uploadContentImage/);
  assert.match(admin, /community\.master\.saveVisualAsset/);
  assert.match(admin, /Texto alternativo/);
  assert.match(admin, /desktop[\s\S]*tablet[\s\S]*mobile/);
  assert.match(admin, /Prévia responsiva com fallback/);
  assert.match(admin, /disabled=\{uploadingVariant !== null \|\| save\.isPending\}/);
  assert.match(master, /visualAssets/);
  assert.match(master, /<VisualAssetsAdmin/);
});

test("componente responsivo usa picture, source e carregamento apropriado", () => {
  const component = read("src/components/ResponsiveVisualAsset.tsx");
  const hook = read("src/hooks/useVisualAsset.ts");
  assert.match(component, /<picture/);
  assert.match(component, /media="\(max-width: 639px\)"/);
  assert.match(component, /media="\(max-width: 1023px\)"/);
  assert.match(component, /loading=\{eager \? "eager" : "lazy"\}/);
  assert.match(component, /decoding="async"/);
  assert.match(hook, /community\.visualAssets\.active/);
});

test("slots visuais estão conectados às páginas sem substituir copy em HTML", () => {
  for (const [page, slot] of [
    ["Inicio", "inicio"],
    ["Home", "public_home"],
    ["Checkout", "checkout"],
    ["CamilaRibeiroAutismo", "public_camila"],
    ["Receitas", "receitas"],
    ["Academia", "academia"],
    ["Assinatura", "plano"],
  ]) {
    assert.match(read(`src/pages/${page}.tsx`), new RegExp(`slot="${slot}"`));
  }
  assert.match(read("src/pages/Auth.tsx"), /useVisualAsset\("login"/);
  assert.match(read("src/pages/Checkout.tsx"), /R\$ 49,90/);
});
