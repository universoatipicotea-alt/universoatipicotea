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

  assert.match(overview, /\/gestao\/conteudos\/academia/);
  assert.match(overview, /\/gestao\/conteudos\/receitas/);
  assert.match(overview, /\/gestao\/conteudos\/modulos/);
  assert.match(overview, /\/gestao\/conteudos\/categorias/);
  assert.doesNotMatch(overview, /useMutation/);
});

test("sidebar representa setores e funções sem repetir ferramentas", () => {
  const navigation = read("src/components/management/managementSections.ts");
  const shell = read("src/components/management/ManagementShell.tsx");

  assert.match(navigation, /destinations/);
  assert.match(navigation, /\/gestao\/comercial\/produtos/);
  assert.match(navigation, /\/gestao\/plataforma\/aparencia/);
  assert.match(navigation, /\/gestao\/conteudos\/importacao/);
  assert.doesNotMatch(navigation, /admin\?tab|master\?view/);
  assert.match(shell, /section\.destinations/);
});
