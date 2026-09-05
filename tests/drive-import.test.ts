import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createDriveMediaToken,
  verifyDriveMediaToken,
} from "../src/lib/drive-media-token.server.ts";
import {
  driveRollbackDecision,
  extractDriveId,
  initialPosition,
  normalizeDriveName,
  reconcileDriveCandidates,
  type DriveImportCandidate,
} from "../src/lib/drive-import.ts";

const candidate: DriveImportCandidate = {
  key: "module_cover:drive-file-01",
  targetKind: "module_cover",
  driveFileId: "drive-file-01",
  driveFolderId: "covers-folder",
  title: "Primeiros Passos",
  position: 1,
  suggestedModulePosition: 1,
  suggestedModuleId: null,
  suggestedModuleName: "Primeiros Passos",
  suggestedContentPath: "Academia / 01 — Primeiros Passos",
  cover: {
    id: "drive-file-01",
    name: "01_MODULO_PRIMEIROS_PASSOS.png",
    mimeType: "image/png",
    parents: ["covers-folder"],
    modifiedTime: "2026-09-04T10:00:00.000Z",
    size: 100,
    md5Checksum: "checksum",
    version: "2",
    webViewLink: null,
    canDownload: true,
  },
  pdf: null,
  video: null,
  words: [],
  classifications: ["ready"],
  editorialStatus: "draft",
  platformSituation: "Capa oficial encontrada",
  currentFolder: "Capas oficiais",
  correctFolder: "Capas oficiais",
  recommendedAction: "Importar",
  existingTargetId: null,
  selectedByDefault: true,
  alerts: [],
};

test("extrai ID, posição e normaliza nomes sem usar o nome como identidade", () => {
  assert.equal(
    extractDriveId("https://drive.google.com/drive/folders/12kntI0QJphbPU_hmraPthUE_bWN6ekvh"),
    "12kntI0QJphbPU_hmraPthUE_bWN6ekvh",
  );
  assert.equal(initialPosition("07 — ROTINA E AUTONOMIA"), 7);
  assert.equal(normalizeDriveName("Comunicação"), "comunicacao");
  assert.throws(() => extractDriveId("curto"));
});

test("módulo existente recebe a capa sem criar duplicata", () => {
  const [result] = reconcileDriveCandidates(
    [{ ...candidate }],
    [
      {
        id: 9,
        name: "Primeiros Passos",
        slug: "primeiros-passos",
        position: 1,
        status: "published",
        coverImageKey: null,
      },
    ],
    [],
    [],
  );
  assert.equal(result.existingTargetId, 9);
  assert.equal(result.suggestedModuleId, 9);
  assert.equal(result.selectedByDefault, true);
});

test("capa existente e Drive ID registrado exigem confirmação", () => {
  const [result] = reconcileDriveCandidates(
    [{ ...candidate }],
    [
      {
        id: 9,
        name: "Primeiros Passos",
        slug: "primeiros-passos",
        position: 1,
        status: "published",
        coverImageKey: "existing.png",
      },
    ],
    [],
    [
      {
        driveFileId: "drive-file-01",
        driveVersion: "1",
        driveModifiedAt: "2026-09-03T10:00:00.000Z",
      },
    ],
  );
  assert.equal(result.selectedByDefault, false);
  assert.ok(result.classifications.includes("registered"));
  assert.ok(result.classifications.includes("review"));
});

test("rollback permite estado intacto e bloqueia edição ou publicação posterior", () => {
  const imported = {
    targetKind: "academy_guide" as const,
    targetUpdatedAt: "2026-09-04T10:00:00.000Z",
    created: true,
  };
  assert.deepEqual(
    driveRollbackDecision({ status: "draft", updatedAt: "2026-09-04T10:00:00.000Z" }, imported),
    { allowed: true, reason: "safe" },
  );
  assert.equal(
    driveRollbackDecision({ status: "draft", updatedAt: "2026-09-04T11:00:00.000Z" }, imported)
      .reason,
    "edited_after_import",
  );
  assert.equal(
    driveRollbackDecision({ status: "published", updatedAt: "2026-09-04T10:00:00.000Z" }, imported)
      .reason,
    "no_longer_draft",
  );
});

test("token de vídeo do Drive é curto, assinado e vinculado ao guia", () => {
  process.env.DRIVE_MEDIA_SIGNING_SECRET = "teste-local-com-mais-de-trinta-e-dois-caracteres";
  const token = createDriveMediaToken(42, 60);
  assert.equal(verifyDriveMediaToken(token, 42), true);
  assert.equal(verifyDriveMediaToken(token, 43), false);
  assert.equal(verifyDriveMediaToken(`${token}x`, 42), false);
});

test("migration protege o ledger e não concede acesso aos quatro papéis do cliente", () => {
  const migration = readFileSync(
    new URL("../supabase/migrations/20260904150000_add_drive_import_ledger.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/g);
  assert.match(migration, /TO service_role/g);
  assert.doesNotMatch(migration, /TO authenticated|TO anon/i);
  assert.doesNotMatch(migration, /^(?!\s*--).*\b(?:TRUNCATE|DROP\s+TABLE)\b/im);
});

test("backend exige Admin Master, importa rascunho e registra compensação", () => {
  const server = readFileSync(new URL("../src/lib/community.server.ts", import.meta.url), "utf8");
  for (const route of [
    "community.master.drive.preview",
    "community.master.drive.importItems",
    "community.master.drive.history",
    "community.master.drive.rollback",
  ]) {
    const start = server.indexOf(`case "${route}"`);
    assert.notEqual(start, -1);
    assert.match(server.slice(start, start + 350), /requireMaster\(\)/);
  }
  assert.match(server, /status: "draft"/);
  assert.match(server, /compensateFailedDriveImport/);
  assert.match(server, /drive_file_id/);
  assert.match(server, /overwriteConfirmed/);
});

test("módulos em breve ficam bloqueados sem conteúdo fictício", () => {
  const page = readFileSync(new URL("../src/pages/Academia.tsx", import.meta.url), "utf8");
  const hub = readFileSync(new URL("../src/components/CategoryHub.tsx", import.meta.url), "utf8");
  assert.match(page, /coming_soon/);
  assert.match(hub, /aria-disabled/);
  assert.match(hub, /cursor-not-allowed/);
});
