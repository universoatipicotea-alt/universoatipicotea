import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_IMAGE_MIME_TYPES,
  COMMUNITY_MAX_IMAGE_BYTES,
  COMMUNITY_MAX_IMAGES,
  boundedCommunityLimit,
  normalizeCommunityText,
  parseClientRequestId,
  parseCommunityCategory,
  parseCommunitySort,
  parsePositiveCommunityId,
  validateCommentBody,
  validateReportReason,
  validateTopicBody,
  validateTopicTitle,
} from "../src/shared/community.ts";

test("normaliza texto sem destruir acentos ou quebras de linha", () => {
  assert.equal(normalizeCommunityText("  Olá\r\ncomunidade\u0000  "), "Olá\ncomunidade");
});

test("valida publicações e rejeita conteúdo sem mensagem compreensível", () => {
  assert.equal(validateTopicTitle("Ajuda com a rotina"), "Ajuda com a rotina");
  assert.equal(
    validateTopicBody("Como vocês organizam a rotina da manhã em casa?"),
    "Como vocês organizam a rotina da manhã em casa?",
  );
  assert.equal(validateCommentBody("Eu também passei por isso."), "Eu também passei por isso.");
  assert.equal(validateReportReason("Contém dados pessoais"), "Contém dados pessoais");

  assert.throws(() => validateTopicTitle("!!!!!!"), /mensagem compreensível/);
  assert.throws(
    () => validateTopicBody("https://example.com/qualquer-coisa"),
    /mensagem compreensível/,
  );
  assert.throws(() => validateCommentBody("....."), /mensagem compreensível/);
  assert.throws(() => validateReportReason("aaa"), /mensagem compreensível/);
});

test("categorias, ordenação, ids e limites usam listas allowlists", () => {
  assert.ok(COMMUNITY_CATEGORIES.includes("Comunicação"));
  assert.equal(parseCommunityCategory("Autocuidado"), "Autocuidado");
  assert.throws(() => parseCommunityCategory("<script>"), /categoria válida/);
  assert.equal(parseCommunitySort("respondidas"), "respondidas");
  assert.equal(parseCommunitySort("qualquer"), "recentes");
  assert.equal(boundedCommunityLimit(200, 12, 30), 30);
  assert.equal(boundedCommunityLimit("x", 12, 30), 12);
  assert.equal(parsePositiveCommunityId("42", "Conversa"), 42);
  assert.throws(() => parsePositiveCommunityId(0, "Conversa"), /inválido/);
});

test("idempotência e política de imagens têm limites explícitos", () => {
  const requestId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  assert.equal(parseClientRequestId(requestId), requestId);
  assert.throws(() => parseClientRequestId("não-é-uuid"), /Identificador/);
  assert.equal(COMMUNITY_MAX_IMAGES, 4);
  assert.equal(COMMUNITY_MAX_IMAGE_BYTES, 5 * 1024 * 1024);
  assert.deepEqual(COMMUNITY_IMAGE_MIME_TYPES, ["image/jpeg", "image/png", "image/webp"]);
});
