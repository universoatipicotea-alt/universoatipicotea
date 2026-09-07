import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("funil mantém assinatura de R$ 49,90 e checkout real", () => {
  const home = read("src/pages/Home.tsx");
  const checkout = read("src/pages/Checkout.tsx");
  assert.match(home, /R\$ 49,90/);
  assert.match(home, /goCheckout/);
  assert.match(checkout, /billing\.createCheckout/);
  assert.match(checkout, /Pagar agora/);
  assert.match(checkout, /R\$ 49,90/);
});

test("métricas baixas não exibem zeros como prova social", () => {
  const home = read("src/pages/Home.tsx");
  assert.match(home, /showQuantitativeMetrics/);
  assert.match(home, /qualitativeMetrics/);
  assert.match(home, /CountUp/);
});

test("animações preservam preferência por movimento reduzido", () => {
  const styles = read("src/styles.css");
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /scroll-reveal/);
  assert.match(styles, /progress-shimmer/);
});
