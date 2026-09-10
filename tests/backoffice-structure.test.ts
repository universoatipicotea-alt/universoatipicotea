import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("backoffice possui shell próprio e quatro áreas administrativas", () => {
  const shell = read("src/components/management/ManagementShell.tsx");
  const navigation = read("src/components/management/managementSections.ts");
  const hub = read("src/pages/ManagementHub.tsx");
  const section = read("src/pages/ManagementSection.tsx");

  assert.doesNotMatch(shell, /MemberShell/);
  assert.match(navigation, /Conteúdo e produtos/);
  assert.match(navigation, /Comunidade e clientes/);
  assert.match(navigation, /Comercial e vendas/);
  assert.match(navigation, /Plataforma e segurança/);
  assert.match(shell, /Visualizar como membro/);
  assert.match(shell, /admin_master/);
  assert.match(hub, /managementSections/);
  assert.match(section, /masterOnly/);
});

test("rotas administrativas são privadas para mecanismos de busca", () => {
  for (const file of [
    "gestao.tsx",
    "gestao_.conteudos.tsx",
    "gestao_.comunidade.tsx",
    "gestao_.comercial.tsx",
    "gestao_.plataforma.tsx",
  ]) {
    const route = read(`src/routes/${file}`);
    assert.match(route, /noindex, nofollow/);
  }
});

test("login direciona equipes à gestão e mantém membros na área de assinantes", () => {
  const auth = read("src/pages/Auth.tsx");
  assert.match(auth, /accessRole === "admin_master"/);
  assert.match(auth, /"\/gestao"/);
  assert.match(auth, /accessRole === "admin"/);
  assert.match(auth, /"\/gestao\/conteudos"/);
  assert.match(auth, /"\/inicio"/);
});

test("ferramentas atuais recebem rotas próprias sem duplicar suas regras", () => {
  const section = read("src/pages/ManagementSection.tsx");
  const admin = read("src/pages/Admin.tsx");
  const master = read("src/pages/Master.tsx");

  assert.match(section, /\/gestao\/conteudos\/academia/);
  assert.match(section, /\/gestao\/comunidade\/moderacao/);
  assert.match(section, /\/gestao\/plataforma\/acessos/);
  assert.match(section, /\/gestao\/conteudos\/importacao/);
  assert.match(admin, /new URLSearchParams\(search\)\.get\("tab"\)/);
  assert.match(master, /new URLSearchParams\(search\)\.get\("view"\)/);
  assert.match(admin, /fixedTab/);
  assert.match(master, /fixedView/);
  assert.match(admin, /<ManagementShell/);
  assert.match(master, /<ManagementShell/);
});
