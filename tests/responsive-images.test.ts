import assert from "node:assert/strict";
import { statSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("artes principais possuem variantes WebP leves por viewport", () => {
  for (const name of [
    "academia-universo-atipico",
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

test("capas públicas da Camila são leves e associadas aos cards", () => {
  const assets = [
    ["public/camila-atualizatea.webp", 100_000],
    ["public/camila-lacos-do-espectro.png", 150_000],
    ["public/camila-mundo-azul.png", 100_000],
  ] as const;

  for (const [file, budget] of assets) {
    assert.ok(statSync(file).size < budget, `${file} deve permanecer abaixo de ${budget} bytes`);
  }

  const links = read("src/config/camilaPublicLinks.ts");
  assert.match(links, /camila-atualizatea\.webp/);
  assert.match(links, /camila-lacos-do-espectro\.png/);
  assert.match(links, /camila-mundo-azul\.png/);
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
