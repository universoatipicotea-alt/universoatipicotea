import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("gestão de conteúdo usa indicadores reais do acervo", () => {
  const overview = read("src/components/management/ContentOperationsOverview.tsx");
  const section = read("src/pages/ManagementSection.tsx");

  assert.match(overview, /community\.admin\.dashboard\.useQuery/);
  assert.match(overview, /community\.admin\.testGuides\.useQuery/);
  assert.match(overview, /community\.admin\.taxonomy\.useQuery/);
  assert.match(overview, /status === "published"/);
  assert.match(overview, /status === "draft"/);
  assert.match(overview, /status === "coming_soon"/);
  assert.match(section, /area === "conteudos"/);
  assert.match(section, /ContentOperationsOverview/);
});

test("atalhos editoriais preservam as ferramentas existentes", () => {
  const overview = read("src/components/management/ContentOperationsOverview.tsx");

  assert.match(overview, /\/admin\?tab=guides/);
  assert.match(overview, /\/admin\?tab=recipes/);
  assert.match(overview, /\/admin\?tab=academyModules/);
  assert.match(overview, /\/admin\?tab=recipeCategories/);
  assert.doesNotMatch(overview, /useMutation/);
});
