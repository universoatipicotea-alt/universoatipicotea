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
  assert.match(checkout, /Um universo de possibilidades/);
  assert.match(checkout, /bg-gradient-to-r/);
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

test("login aprimorado preserva autenticação e não anuncia gratuidade", () => {
  const auth = read("src/pages/Auth.tsx");
  const visiblePages = ["Home", "Checkout", "Assinatura", "Academia", "Auth"]
    .map((name) => read(`src/pages/${name}.tsx`))
    .join("\n");
  assert.match(auth, /trpc\.auth\.login/);
  assert.match(auth, /showPassword/);
  assert.match(auth, /auth\.resetPassword/);
  assert.match(auth, /login-universo-atipico\.png/);
  assert.doesNotMatch(visiblePages, /gratuit[oa]|grátis/i);
});

test("página de assinatura apresenta o Plano Universo e preserva o checkout", () => {
  const subscription = read("src/pages/Assinatura.tsx");
  assert.match(subscription, /Plano Universo/);
  assert.match(subscription, /Um Universo inteiro por/);
  assert.match(subscription, /R\$ 49,90/);
  assert.match(subscription, /Menos de R\$ 1,67 por dia/);
  assert.match(subscription, /QUERO FAZER PARTE/);
  assert.match(subscription, /setLocation\("\/checkout"\)/);
  assert.match(subscription, /\/plano-universo-oferta\.png/);
  assert.match(subscription, /whitespace-nowrap/);
  assert.doesNotMatch(subscription, /Cobrança ainda não ativada/i);
});

test("página pública da Camila preserva destinos oficiais e não exige autenticação", () => {
  const page = read("src/pages/CamilaRibeiroAutismo.tsx");
  const profileHeader = read("src/components/camila/PublicProfileHeader.tsx");
  const socialLinks = read("src/components/camila/SocialLinks.tsx");
  const linkCard = read("src/components/camila/PublicLinkCard.tsx");
  const route = read("src/routes/camilaribeiroautismo.tsx");
  const links = read("src/config/camilaPublicLinks.ts");
  assert.match(route, /createFileRoute\("\/camilaribeiroautismo"\)/);
  assert.match(route, /Camila Ribeiro Autismo \| Links/);
  assert.doesNotMatch(page, /useAuth|MemberShell|redirect/);
  assert.doesNotMatch(profileHeader, /<img|avatar|personagem/i);
  assert.match(socialLinks, /target="_blank"/);
  assert.match(socialLinks, /rel="noopener noreferrer"/);
  assert.match(linkCard, /target="_blank"/);
  assert.match(links, /https:\/\/universoatipico\.app/);
  assert.match(links, /chat\.whatsapp\.com/);
  assert.match(links, /https:\/\/t\.me\//);
  assert.match(links, /vt\.tiktok\.com/);
  assert.match(links, /camila_(universo_atipico|lacos_espectro|atualizatea|mundo_azul)/);
});

test("áreas de membros usam as novas artes sem substituir dados reais", () => {
  assert.match(read("src/pages/Inicio.tsx"), /home-membros-universo-atipico\.png/);
  assert.match(read("src/pages/Receitas.tsx"), /receitas-universo-atipico\.png/);
  assert.match(read("src/pages/Academia.tsx"), /academia-universo-atipico\.png/);
  assert.match(read("src/pages/Inicio.tsx"), /memberDashboard/);
});
