import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("a experiência pública comunica acesso gratuito sem iniciar Stripe", () => {
  const home = read("src/pages/Home.tsx");
  const checkout = read("src/pages/Checkout.tsx");
  assert.match(home, /acesso gratuito agora/i);
  assert.match(home, /showQuantitativeMetrics/);
  assert.doesNotMatch(checkout, /createCheckout\.mutate|Pagar agora/);
  assert.match(checkout, /Criar acesso gratuito/);
});

test("navegação e leitor da Academia mantêm destinos corretos", () => {
  const shell = read("src/components/MemberShell.tsx");
  const academia = read("src/pages/Academia.tsx");
  assert.match(shell, /href: "\/academia", label: "Academia Atípica"/);
  assert.match(shell, /href: "\/biblioteca", label: "Biblioteca"/);
  assert.match(academia, /openGuide\(guide\.id, guide\.title\)/);
  assert.doesNotMatch(academia, /facilitadores\?tab=test-product/);
});

test("movimento possui fallback de acessibilidade", () => {
  const styles = read("src/styles.css");
  const motion = read("src/components/Motion.tsx");
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /scroll-reveal/);
  assert.match(styles, /progress-shimmer/);
  assert.match(motion, /IntersectionObserver/);
});
