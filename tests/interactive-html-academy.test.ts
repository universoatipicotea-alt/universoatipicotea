import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(process.cwd(), "src", "content", "academy");
const lessons = [
  ...fs.readdirSync(path.join(root, "module-01")).filter((name) => /_Slides\.html$/.test(name)).map((name) => path.join(root, "module-01", name)),
  ...fs.readdirSync(path.join(root, "module-02")).filter((name) => /_Slides\.html$/.test(name)).map((name) => path.join(root, "module-02", name)),
  ...fs.readdirSync(path.join(root, "module-03")).filter((name) => /_Slides\.html$/.test(name)).map((name) => path.join(root, "module-03", name)),
];

test("Academia contém as 16 aulas HTML originais dos três módulos", () => {
  assert.equal(lessons.length, 16);
  for (let number = 1; number <= 16; number += 1) {
    assert.ok(lessons.some((file) => new RegExp(`-A${number}_Slides\\.html$`).test(file)), `Aula ${number}`);
  }
});

test("cada aula preserva navegação, menu, interações e regras mobile", () => {
  const checks = [/next|prev|pr[oó]ximo|anterior/i, /menu|mapa/i, /card/i, /tab/i, /flip/i, /quiz/i, /checklist|checkbox|check-item/i, /@media[^{}]*max-width|viewport/i];
  for (const file of lessons) {
    const html = fs.readFileSync(file, "utf8");
    for (const check of checks) assert.match(html, check, path.basename(file));
  }
});

test("HTML não é publicado como arquivo estático e usa rota protegida", () => {
  assert.ok(lessons.every((file) => !file.includes(`${path.sep}public${path.sep}`)));
  const route = fs.readFileSync(path.join(process.cwd(), "src", "routes", "api", "protected-html.$guideId.ts"), "utf8");
  assert.match(route, /verifyDriveMediaToken/);
  assert.match(route, /content_type !== "html"/);
  assert.match(route, /status !== "published"/);
  assert.match(route, /cache-control": "private, no-store"/);
});
