import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("gestão da comunidade usa dados reais e explicita a fila de cuidado", () => {
  const overview = read("src/components/management/CommunityOperationsOverview.tsx");
  const section = read("src/pages/ManagementSection.tsx");

  assert.match(overview, /community\.admin\.dashboard\.useQuery/);
  assert.match(overview, /status === "open"/);
  assert.match(overview, /status === "hidden"/);
  assert.match(overview, /status === "visible"/);
  assert.match(overview, /status === "published"/);
  assert.match(overview, /Fila de cuidado/);
  assert.match(section, /area === "comunidade"/);
  assert.match(section, /CommunityOperationsOverview/);
});

test("ações da comunidade usam somente as rotas do setor", () => {
  const overview = read("src/components/management/CommunityOperationsOverview.tsx");

  assert.match(overview, /\/gestao\/comunidade\/moderacao/);
  assert.match(overview, /\/gestao\/comunidade\/facilitadores/);
  assert.doesNotMatch(overview, /\/admin\?tab|\/master\?view/);
  assert.doesNotMatch(overview, /useMutation/);
});
