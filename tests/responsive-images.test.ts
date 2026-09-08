import assert from "node:assert/strict";
import { statSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("artes principais possuem variantes WebP leves por viewport", () => {
  for (const name of [
    "academia-universo-atipico",
    "camila-public-universo-atipico",
    "home-membros-universo-atipico",
    "login-universo-atipico",
    "plano-universo-oferta",
    "receitas-universo-atipico",
  ]) {
    for (const variant of ["mobile", "tablet", "desktop"]) {
      const file = `public/${name}-${variant}.webp`;
      assert.ok(statSync(file).size < 200_000, `${file} deve permanecer abaixo de 200 KB`);
    }
  }
});

test("componente responsivo não baixa a arte desktop no celular", () => {
  const component = read("src/components/ResponsiveImage.tsx");
  assert.match(component, /<picture/);
  assert.match(component, /media="\(max-width: 639px\)"/);
  assert.match(component, /media="\(max-width: 1023px\)"/);
  assert.match(component, /loading=\{eager \? "eager" : "lazy"\}/);
  assert.match(component, /fetchPriority=\{eager \? "high" : "auto"\}/);
});

test("cards editoriais preservam a imagem inteira", () => {
  assert.match(read("src/components/ContentCard.tsx"), /object-contain/);
  assert.match(read("src/components/CategoryHub.tsx"), /object-contain/);
  assert.match(read("src/components/PdfCover.tsx"), /object-contain/);
});
