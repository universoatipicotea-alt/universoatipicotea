import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("catálogo público da Academia não entrega conteúdo nem origem do vídeo", () => {
  const community = source("../src/lib/community.server.ts");
  const block = community.match(
    /async function listPublicGuideCards\(\)[\s\S]*?\r?\n}\r?\n\r?\nasync function/,
  )?.[0];
  assert.ok(block, "listPublicGuideCards precisa existir");
  assert.doesNotMatch(block, /\bcontent\b|video_url|pdf_key|pdf_url/);
  assert.match(community, /case "community\.publicGuides":[\s\S]*?listPublicGuideCards\(\)/);
});

test("download protegido nunca devolve uma rota inexistente", () => {
  const community = source("../src/lib/community.server.ts");
  const block = community.match(
    /case "community\.forum\.downloadGuide":[\s\S]*?\r?\n[ ]{4}}\r?\n\r?\n[ ]{4}\/\*/,
  )?.[0];
  assert.ok(block, "fluxo de download do guia precisa existir");
  assert.match(block, /signedPdfUrl\(guide\.pdf_key\)/);
  assert.doesNotMatch(block, /\/api\/protected-pdf\/guide/);
});

test("rota pública de vídeo serve somente o VSL configurado", () => {
  const route = source("../src/routes/api/public/ua-video/$.ts");
  assert.match(route, /select\("vsl_video_path"\)/);
  assert.match(route, /key !== funnel\.vsl_video_path/);
});

test("conteúdo sem categoria ou módulo não pode ser publicado", () => {
  const community = source("../src/lib/community.server.ts");
  assert.match(community, /Selecione um módulo antes de publicar este conteúdo/);
  assert.match(community, /Selecione uma categoria antes de publicar esta receita/);
  assert.match(community, /not\("module_id", "is", null\)/);
  assert.match(community, /not\("category_id", "is", null\)/);
});
