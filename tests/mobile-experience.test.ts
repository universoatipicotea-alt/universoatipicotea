import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("leitor de PDF ajusta páginas à largura e respeita telas de alta densidade", () => {
  const reader = source("../src/components/PdfReader.tsx");
  assert.match(reader, /new ResizeObserver/);
  assert.match(reader, /availableWidth \/ naturalViewport\.width/);
  assert.match(reader, /window\.devicePixelRatio/);
  assert.match(reader, /100dvh/);
  assert.match(reader, /touch-pan-x touch-pan-y/);
});

test("PDF só é renderizado depois que canvases e documento estão prontos", () => {
  const reader = source("../src/components/PdfReader.tsx");
  assert.match(reader, /setPdfDocument\(document\)/);
  assert.match(reader, /if \(!pdfDocument \|\| !pageCount \|\| !readerWidth\) return/);
  assert.match(reader, /requestAnimationFrame/);
});

test("animação da marca respeita preferência por movimento reduzido", () => {
  const home = source("../src/pages/Home.tsx");
  const styles = source("../src/styles.css");
  assert.match(home, /<BrandOrbitHero \/>/);
  assert.match(styles, /prefers-reduced-motion: no-preference/);
  assert.match(styles, /brand-orbit-spin/);
});
