import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("categorias de receitas e módulos são rotas independentes", () => {
  assert.equal(
    existsSync(new URL("../src/routes/receitas_.$categoria.tsx", import.meta.url)),
    true,
  );
  assert.equal(existsSync(new URL("../src/routes/academia_.$modulo.tsx", import.meta.url)), true);
  const routeTree = read("src/routeTree.gen.ts");
  assert.match(routeTree, /fullPath: '\/receitas\/\$categoria'/);
  assert.match(routeTree, /fullPath: '\/academia\/\$modulo'/);
});

test("Academia abre PDFs no próprio módulo", () => {
  const academia = read("src/pages/Academia.tsx");
  assert.match(academia, /PdfReaderDialog/);
  assert.doesNotMatch(academia, /setLocation\(`\/biblioteca\?guide=/);
  assert.match(academia, /`\/academia\/\$\{moduleSlug\}`/);
});

test("Biblioteca é derivada do histórico real do usuário", () => {
  const library = read("src/pages/Library.tsx");
  const server = read("src/lib/community.server.ts");
  assert.match(library, /dashboard\.data\?\.progress/);
  assert.doesNotMatch(library, /publicGuides/);
  assert.match(library, /Continuar lendo/);
  assert.match(library, /Histórico/);
  assert.match(server, /\.limit\(50\)/);
  assert.match(server, /lastAccessAt:/);
});
