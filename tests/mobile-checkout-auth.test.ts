import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("checkout preserva Stripe e mantém preço e CTAs íntegros no mobile", () => {
  const checkout = read("src/pages/Checkout.tsx");

  assert.match(checkout, /trpc\.billing\.createCheckout/);
  assert.match(checkout, /Pagar agora — R\$ 49,90\/mês/);
  assert.match(checkout, /whitespace-nowrap/);
  assert.match(checkout, /text-\[clamp\(2\.15rem,11vw,4\.8rem\)\]/);
  assert.match(checkout, /min-\[360px\]:grid-cols-2/);
  assert.match(checkout, /aria-busy=\{createCheckout\.isPending\}/);
});

test("login preserva autenticação e não requisita a arte desktop no mobile", () => {
  const auth = read("src/pages/Auth.tsx");

  assert.match(auth, /trpc\.auth\.login/);
  assert.match(auth, /auth\.resetPassword/);
  assert.match(auth, /source media="\(min-width: 1280px\)"/);
  assert.match(auth, /srcSet=\{loginVisual\.desktop\}/);
  assert.match(auth, /login-universo-atipico-desktop\.webp/);
  assert.match(auth, /useVisualAsset\("login"/);
  assert.match(auth, /src="data:image\/gif;base64/);
  assert.doesNotMatch(auth, /src="\/login-universo-atipico\.png"/);
  assert.match(auth, /object-contain/);
});
