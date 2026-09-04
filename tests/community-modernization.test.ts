import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("migration da comunidade é aditiva e preserva conversas existentes", () => {
  const sql = read("supabase/migrations/20260904120000_expand_community_discussions.sql");
  assert.match(sql, /ADD COLUMN IF NOT EXISTS parent_comment_id/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.ua_forum_reactions/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.ua_forum_reports/i);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /ua_sync_forum_topic_activity/i);
  assert.doesNotMatch(sql, /\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b/i);
});

test("respostas encadeadas são validadas no backend", () => {
  const server = read("src/lib/community.server.ts");
  assert.match(server, /parent_comment_id: parentCommentId/);
  assert.match(server, /parent\.topic_id !== topic\.id/);
  assert.match(server, /community\.forum\.toggleReaction/);
  assert.match(server, /community\.forum\.updateComment/);
  assert.match(server, /comment\.author_id !== user\.id/);
  assert.match(server, /community\.forum\.report/);
  assert.match(server, /O título deve ter entre 5 e 180 caracteres/);
  assert.match(server, /reported_body: comment\?\.body/);
});

test("Comunidade é o destino principal e inclui respostas abertas", () => {
  const route = read("src/routes/comunidade.tsx");
  const shell = read("src/components/MemberShell.tsx");
  const forum = read("src/pages/Forum.tsx");
  assert.match(route, /pages\/Forum/);
  assert.match(shell, /href: "\/comunidade", label: "Comunidade"/);
  assert.match(forum, /Responder a esta mensagem/);
  assert.match(forum, /Denunciar conteúdo/);
  assert.match(forum, /Mais respondidas/);
});

test("página de módulo usa experiência visual própria", () => {
  const academia = read("src/pages/Academia.tsx");
  assert.match(academia, /Progresso do módulo/);
  assert.match(academia, /Conteúdos do módulo/);
  assert.match(academia, /ratio="16 \/ 10"/);
});

test("home pública apresenta conteúdo em cartões compactos", () => {
  const home = read("src/pages/Home.tsx");
  assert.match(home, /aspect-\[4\/3\]/);
  assert.match(home, /Acesso imediato/);
  assert.match(home, /guides\.slice\(0, 3\)/);
  assert.match(home, /recipes\.slice\(0, 3\)/);
});
