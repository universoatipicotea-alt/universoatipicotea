import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("landing pública não devolve conversas privadas nem autores", () => {
  const server = read("src/lib/community.server.ts");
  const landing = server.match(
    /case "community\.landing":[\s\S]*?(?=case "community\.visualAssets\.active")/,
  )?.[0];
  assert.ok(landing, "endpoint community.landing precisa existir");
  assert.doesNotMatch(landing, /listTopics|recentTopics|topics:/);
});

test("backend exige membro e oferece paginação, propriedade e moderação", () => {
  const server = read("src/lib/community.server.ts");
  for (const endpoint of [
    "community.forum.feed",
    "community.forum.comments.list",
    "community.forum.uploadImage",
    "community.forum.deleteImage",
    "community.forum.createTopic",
    "community.forum.updateTopic",
    "community.forum.deleteTopic",
    "community.forum.toggleTopicReaction",
    "community.forum.toggleReaction",
    "community.forum.report",
  ]) {
    assert.match(server, new RegExp(endpoint.replaceAll(".", "\\.")));
  }
  assert.match(server, /assertMemberContent\(user\)/);
  assert.match(server, /ua_consume_forum_rate_limit/);
  assert.match(server, /author_id !== user\.id/);
  assert.match(server, /parent\.parent_comment_id/);
  assert.match(server, /createSignedUrls|createSignedUrl/);
});

test("migração é aditiva, indexada e mantém mídia da comunidade privada", () => {
  const sql = read("supabase/migrations/20260908143000_community_high_performance.sql");
  assert.doesNotMatch(sql, /\bDROP\s+TABLE\b|\bTRUNCATE\b/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+public\.ua_forum_(topics|comments|attachments)\b/i);
  assert.match(sql, /'community-media'[\s\S]*false/i);
  assert.match(sql, /ua_forum_attachments[\s\S]*ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /ua_forum_rate_limits/);
  assert.match(sql, /ua_list_forum_topics/);
  assert.match(sql, /ua_list_forum_root_comments/);
  assert.match(sql, /ua_create_forum_topic/);
  assert.match(sql, /ua_toggle_forum_topic_reaction/);
  assert.match(sql, /ua_toggle_forum_comment_reaction/);
  assert.match(sql, /ua_enforce_forum_reply_depth/);
  assert.match(sql, /USING GIN\(search_document\)/i);
  assert.match(sql, /UNIQUE\(topic_id, user_id, reaction\)/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION[\s\S]*authenticated/i);
});

test("interface tem estados reais, anexos, carregamento incremental e confirmações", () => {
  const forum = read("src/pages/Forum.tsx");
  const composer = read("src/components/community/CommunityComposer.tsx");
  const gallery = read("src/components/community/CommunityImageGallery.tsx");
  assert.match(forum, /community\.forum\.feed/);
  assert.match(forum, /Carregar mais conversas/);
  assert.match(forum, /Carregar mais respostas/);
  assert.match(forum, /ConfirmCommunityAction/);
  assert.match(forum, /Denunciar conteúdo/);
  assert.match(composer, /COMMUNITY_MAX_IMAGES/);
  assert.match(composer, /community\.forum\.uploadImage/);
  assert.match(composer, /clientRequestId/);
  assert.match(composer, /Evite expor|sem expor/i);
  assert.match(gallery, /aria-label/);
  assert.doesNotMatch(forum, /fixture|mockTopic|fakePost/i);
});

test("feed mantém compatibilidade durante a janela antes da migration", () => {
  const server = read("src/lib/community.server.ts");
  const forum = read("src/pages/Forum.tsx");
  assert.match(server, /forumUpgradeMissing/);
  assert.match(server, /from\("ua_forum_topics"\)\.select\("\*"\)/);
  assert.match(server, /from\("ua_forum_comments"\)/);
  assert.match(server, /Compatibilidade temporária durante a janela entre deploy e migration/);
  assert.match(forum, /bg-\[#f4c96b\]/);
  assert.match(forum, /!text-\[#071f4d\]/);
});

test("respostas aparecem inline e fotos salvas são exibidas no feed", () => {
  const server = read("src/lib/community.server.ts");
  const forum = read("src/pages/Forum.tsx");
  const feedCard = read("src/components/community/CommunityFeedCard.tsx");
  assert.match(forum, /replyTo === comment\.id/);
  assert.match(forum, /Responder para/);
  assert.match(forum, /autoFocus/);
  assert.match(forum, /submitReply\(event, comment\.id\)/);
  assert.match(feedCard, /Abrir conversa e responder/);
  assert.match(feedCard, />\s*Responder\s*</);
  assert.match(feedCard, /href=\{topicHref\}/);
  assert.match(feedCard, /\/comunidade\?topic=/);
  assert.doesNotMatch(feedCard, /onClick=\{onOpen\}/);
  assert.match(forum, /window\.location\.assign\(`\/comunidade\?topic=/);
  assert.match(server, /select\("user_id,display_name,avatar_url,avatar_key"\)/);
  assert.match(server, /`\/api\/public\/ua-image\/\$\{profile\.avatar_key\}`/);
  assert.match(server, /avatarKey\.startsWith\(`members\/\$\{user\.id\}\/avatars\/`\)/);
});
