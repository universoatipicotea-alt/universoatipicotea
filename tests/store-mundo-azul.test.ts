import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Loja Mundo Azul reaproveita ua_facilitators sem duplicar produtos", () => {
  const migration = read("supabase/migrations/20260918120000_store_mundo_azul.sql");
  assert.match(migration, /ALTER TABLE public\.ua_facilitators/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS public\.ua_store_products/);
  assert.match(migration, /visible_public boolean NOT NULL DEFAULT false/);
  assert.match(migration, /visible_members boolean NOT NULL DEFAULT true/);
  assert.doesNotMatch(migration, /GRANT .* TO anon/i);
});

test("leitura pública possui projeção mínima e filtros explícitos", () => {
  const server = read("src/lib/store.server.ts");
  assert.match(server, /const columns\s*=\s*\n?\s*"id,title,slug,summary/);
  assert.doesNotMatch(server, /const columns = "[^"]*created_by/);
  assert.match(
    server,
    /\.eq\("status",\s*"published"\)[\s\S]{0,40}\.eq\(members \? "visible_members" : "visible_public",\s*true\)/,
  );
  const dispatcher = read("src/lib/community.server.ts");
  assert.match(
    dispatcher,
    /if \(input\.members === true\) await assertMemberContent\(await requireUser\(\)\)/,
  );
  assert.match(dispatcher, /listPublishedFacilitators\(true\)/);
});

test("rotas pública, coleção, produto, membros e gestão estão declaradas", () => {
  assert.match(read("src/routes/lojamundoazul.tsx"), /createFileRoute\("\/lojamundoazul"\)/);
  assert.match(read("src/routes/lojamundoazul_.colecao_.$slug.tsx"), /colecao_\/\$slug/);
  assert.match(read("src/routes/lojamundoazul_.produto_.$slug.tsx"), /produto_\/\$slug/);
  assert.match(read("src/routes/lojamundoazul_.membros.tsx"), /lojamundoazul_\/membros/);
  assert.match(read("src/routes/facilitadores.tsx"), /Navigate to="\/lojamundoazul"/);
  assert.doesNotMatch(
    read("src/routes/facilitadores.tsx"),
    /Navigate to="\/lojamundoazul\/membros"/,
  );
  assert.match(
    read("src/routes/gestao_.comunidade_.facilitadores.tsx"),
    /Navigate to="\/gestao\/lojamundoazul"/,
  );
});

test("migration histórica está pronta para staging sem publicar registros legados", () => {
  const migration = read("supabase/migrations/20260918120000_store_mundo_azul.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.ua_store_collections/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.ua_store_settings/);
  assert.match(migration, /ALTER TABLE public\.ua_store_collections ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /ALTER TABLE public\.ua_store_settings ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /ua_facilitators_slug_unique/);
  assert.match(migration, /ua_facilitators_shop_listing/);
  assert.match(migration, /ua_facilitators_collections_gin/);
  assert.match(
    migration,
    /UPDATE public\.ua_facilitators SET slug = 'produto-' \|\| id WHERE slug IS NULL/,
  );
  assert.doesNotMatch(migration, /UPDATE public\.ua_facilitators SET visible_public = true/i);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM public\.ua_facilitators/i);
});

test("loja é mobile first e compra continua no parceiro", () => {
  const css = read("src/pages/store.css");
  assert.match(css, /@media\s*\(max-width:\s*700px\)/);
  assert.match(css, /\.store-product\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(css, /max-width:\s*100%/);
  assert.doesNotMatch(css, /width:\s*100vw/);
  const page = read("src/pages/Storefront.tsx");
  assert.match(page, /Compras realizadas em sites parceiros|acontece no site\s+parceiro/i);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  assert.match(page, /loading=\{priority \? "eager" : "lazy"\}/);
});
