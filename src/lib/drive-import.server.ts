import { createSign } from "node:crypto";
import {
  assetRole,
  extractDriveId,
  initialPosition,
  normalizeDriveName,
  titleWithoutPosition,
  type DriveFile,
  type DriveImportCandidate,
} from "./drive-import";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DEFAULT_ROOT_FOLDER_ID = "1c72hSOLmBDviGZNhpj8RrANXsPabtkIg";
const DEFAULT_COVERS_FOLDER_ID = "12kntI0QJphbPU_hmraPthUE_bWN6ekvh";
const DEFAULT_EXTRA_FOLDER_ID = "1peHjHLO8dMA_UFw7RVKrU_QKvPvHDftZ";
const MAX_SCANNED_ITEMS = 750;

type DriveApiFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
  md5Checksum?: string;
  version?: string;
  webViewLink?: string;
  capabilities?: { canDownload?: boolean };
};

type FolderEntry = DriveFile & { isFolder: boolean };

function asDriveFile(file: DriveApiFile): FolderEntry {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    parents: file.parents ?? [],
    modifiedTime: file.modifiedTime ?? null,
    size: file.size ? Number(file.size) : null,
    md5Checksum: file.md5Checksum ?? null,
    version: file.version ?? null,
    webViewLink: file.webViewLink ?? null,
    canDownload: file.capabilities?.canDownload !== false,
    isFolder: file.mimeType === "application/vnd.google-apps.folder",
  };
}

function configuredFolder(value: string | undefined, fallback: string) {
  return extractDriveId(value || fallback);
}

export function driveImportDefaults() {
  return {
    rootFolderId: configuredFolder(
      process.env["GOOGLE_DRIVE_DEFAULT_ROOT_FOLDER_ID"],
      DEFAULT_ROOT_FOLDER_ID,
    ),
    coversFolderId: configuredFolder(
      process.env["GOOGLE_DRIVE_MODULE_COVERS_FOLDER_ID"],
      DEFAULT_COVERS_FOLDER_ID,
    ),
    extraFolderIds: (process.env["GOOGLE_DRIVE_EXTRA_FOLDER_IDS"] || DEFAULT_EXTRA_FOLDER_ID)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map(extractDriveId),
  };
}

export class GoogleDriveReadClient {
  private accessToken: string | null = null;
  private expiresAt = 0;

  private async token() {
    if (this.accessToken && Date.now() < this.expiresAt - 60_000) return this.accessToken;
    const email = process.env["GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL"];
    const privateKey = process.env["GOOGLE_DRIVE_PRIVATE_KEY"]?.replace(/\\n/g, "\n");
    if (!email || !privateKey)
      throw new Error(
        "Importação do Drive não configurada. Cadastre GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL e GOOGLE_DRIVE_PRIVATE_KEY nos Secrets.",
      );
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
      iss: email,
      scope: DRIVE_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })}`;
    const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey, "base64url");
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
    });
    if (!response.ok) throw new Error("Não foi possível autenticar a conta de serviço do Drive.");
    const payload = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!payload.access_token) throw new Error("O Google não retornou um token de acesso válido.");
    this.accessToken = payload.access_token;
    this.expiresAt = Date.now() + Number(payload.expires_in ?? 3600) * 1000;
    return this.accessToken;
  }

  async listFolder(folderId: string) {
    const output: FolderEntry[] = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams({
        q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
        pageSize: "100",
        orderBy: "name_natural",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
        fields:
          "nextPageToken,files(id,name,mimeType,parents,modifiedTime,size,md5Checksum,version,webViewLink,capabilities(canDownload))",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const response = await fetch(`${DRIVE_API}/files?${params}`, {
        headers: { authorization: `Bearer ${await this.token()}` },
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 404)
          throw new Error("A conta de serviço não tem acesso à pasta informada.");
        throw new Error(`Falha ao consultar o Drive (${response.status}).`);
      }
      const payload = (await response.json()) as { files?: DriveApiFile[]; nextPageToken?: string };
      output.push(...(payload.files ?? []).map(asDriveFile));
      if (output.length > MAX_SCANNED_ITEMS)
        throw new Error(`A pasta excede o limite seguro de ${MAX_SCANNED_ITEMS} itens por busca.`);
      pageToken = payload.nextPageToken ?? "";
    } while (pageToken);
    return output;
  }
}

function newest(files: DriveFile[]) {
  return (
    [...files].sort((a, b) =>
      String(b.modifiedTime || "").localeCompare(String(a.modifiedTime || "")),
    )[0] ?? null
  );
}

function roleFiles(files: DriveFile[], role: ReturnType<typeof assetRole>) {
  return files.filter((file) => assetRole(file) === role);
}

function moduleName(folderName: string) {
  return titleWithoutPosition(folderName).replace(/\s+/g, " ").trim();
}

export async function scanAcademyDrive(input: {
  rootFolderId?: string;
  coversFolderId?: string;
  extraFolderIds?: string[];
  client?: GoogleDriveReadClient;
}) {
  const defaults = driveImportDefaults();
  const rootFolderId = configuredFolder(input.rootFolderId, defaults.rootFolderId);
  const coversFolderId = configuredFolder(input.coversFolderId, defaults.coversFolderId);
  const extraFolderIds = (input.extraFolderIds ?? defaults.extraFolderIds).map(extractDriveId);
  const client = input.client ?? new GoogleDriveReadClient();
  const rootChildren = await client.listFolder(rootFolderId);
  const academy = rootChildren.find(
    (file) => file.isFolder && normalizeDriveName(file.name).includes("academia atipica"),
  );
  if (!academy) throw new Error("A pasta raiz não contém a área “Academia Atípica”.");
  const moduleFolders = (await client.listFolder(academy.id)).filter(
    (file) => file.isFolder && initialPosition(file.name) !== null,
  );
  const candidates: DriveImportCandidate[] = [];
  const ignored: Array<{ file: string; reason: string; path: string }> = [];
  const warnings: string[] = [];

  for (const moduleFolder of moduleFolders) {
    const modulePosition = initialPosition(moduleFolder.name);
    if (!modulePosition) continue;
    const moduleLabel = moduleName(moduleFolder.name);
    const children = await client.listFolder(moduleFolder.id);
    for (const contentFolder of children.filter((file) => file.isFolder)) {
      const position = initialPosition(contentFolder.name);
      if (position === 0 || position === 99 || position === null) {
        ignored.push({
          file: contentFolder.name,
          reason: position === 99 ? "Referências e apoio técnico" : "Pasta auxiliar de capa",
          path: `${academy.name}/${moduleFolder.name}/${contentFolder.name}`,
        });
        continue;
      }
      const contentChildren = await client.listFolder(contentFolder.id);
      const directFiles = contentChildren.filter((file) => !file.isFolder);
      const coverFolders = contentChildren.filter(
        (file) => file.isFolder && normalizeDriveName(file.name).includes("capa"),
      );
      const coverFiles = (
        await Promise.all(coverFolders.map((folder) => client.listFolder(folder.id)))
      )
        .flat()
        .filter((file) => !file.isFolder && file.mimeType.startsWith("image/"));
      const pdfs = roleFiles(directFiles, "pdf");
      const videos = roleFiles(directFiles, "video");
      const words = roleFiles(directFiles, "word");
      const covers = [...coverFiles, ...roleFiles(directFiles, "guide_cover")];
      const pdf = newest(pdfs);
      const video = newest(videos);
      const cover = newest(covers);
      const classifications: DriveImportCandidate["classifications"] = [];
      const alerts: string[] = [];
      if (pdf || video) classifications.push(cover ? "ready" : "missing_cover");
      else if (words.length) classifications.push("word_only", "missing_official_pdf");
      else classifications.push("review");
      if (pdfs.length > 1 || videos.length > 1 || covers.length > 1) {
        classifications.push("duplicate", "review");
        alerts.push("Há mais de um arquivo candidato para a mesma função.");
      }
      const primary = pdf || video || words[0] || cover;
      if (!primary) continue;
      candidates.push({
        key: `academy_guide:${primary.id}`,
        targetKind: "academy_guide",
        driveFileId: primary.id,
        driveFolderId: contentFolder.id,
        title: titleWithoutPosition(contentFolder.name),
        position,
        suggestedModulePosition: modulePosition,
        suggestedModuleId: null,
        suggestedModuleName: moduleLabel,
        suggestedContentPath: `Módulo ${String(modulePosition).padStart(2, "0")} / ${String(position).padStart(2, "0")} — ${titleWithoutPosition(contentFolder.name)}`,
        cover,
        pdf,
        video,
        words,
        classifications: [...new Set(classifications)],
        editorialStatus: "draft",
        platformSituation: "Ainda não comparado com o banco",
        currentFolder: `${academy.name}/${moduleFolder.name}/${contentFolder.name}`,
        correctFolder: `${academy.name}/${moduleFolder.name}/${contentFolder.name}`,
        recommendedAction: classifications.includes("ready")
          ? "Importar como rascunho"
          : "Completar ou revisar o material antes da importação",
        existingTargetId: null,
        selectedByDefault: classifications.length === 1 && classifications[0] === "ready",
        alerts,
      });
      for (const word of words)
        ignored.push({
          file: word.name,
          reason: pdf ? "Documento editável preservado; o PDF oficial será usado" : "Somente Word",
          path: `${academy.name}/${moduleFolder.name}/${contentFolder.name}`,
        });
    }
  }

  const moduleCovers = (await client.listFolder(coversFolderId)).filter(
    (file) => !file.isFolder && file.mimeType.startsWith("image/"),
  );
  for (const cover of moduleCovers) {
    const position = initialPosition(cover.name);
    if (!position) {
      ignored.push({
        file: cover.name,
        reason: "Capa sem numeração de módulo",
        path: "Capas oficiais",
      });
      continue;
    }
    const moduleFolder = moduleFolders.find((folder) => initialPosition(folder.name) === position);
    candidates.push({
      key: `module_cover:${cover.id}`,
      targetKind: "module_cover",
      driveFileId: cover.id,
      driveFolderId: moduleFolder?.id ?? null,
      title: moduleFolder ? moduleName(moduleFolder.name) : titleWithoutPosition(cover.name),
      position,
      suggestedModulePosition: position,
      suggestedModuleId: null,
      suggestedModuleName: moduleFolder ? moduleName(moduleFolder.name) : null,
      suggestedContentPath: `Capa do Módulo ${String(position).padStart(2, "0")}`,
      cover,
      pdf: null,
      video: null,
      words: [],
      classifications: moduleFolder ? ["ready"] : ["without_module"],
      editorialStatus: "draft",
      platformSituation: "Ainda não comparado com o banco",
      currentFolder: "08 — CAPAS E TEMPLATES/CAPAS OFICIAIS — MÓDULOS DA ACADEMIA",
      correctFolder: "08 — CAPAS E TEMPLATES/CAPAS OFICIAIS — MÓDULOS DA ACADEMIA",
      recommendedAction: moduleFolder
        ? "Relacionar ao módulo existente; não criar outro módulo"
        : "Corrigir manualmente o módulo",
      existingTargetId: null,
      selectedByDefault: Boolean(moduleFolder),
      alerts: [],
    });
  }

  for (const extraFolderId of extraFolderIds) {
    const files = await client.listFolder(extraFolderId);
    for (const file of files.filter((entry) => !entry.isFolder)) {
      if (assetRole(file) !== "pdf") {
        ignored.push({ file: file.name, reason: "Tipo não publicável", path: "Pasta adicional" });
        continue;
      }
      const editorialConflict = normalizeDriveName(file.name).includes(
        "meu filho e autista e agora",
      );
      candidates.push({
        key: `academy_guide:${file.id}`,
        targetKind: "academy_guide",
        driveFileId: file.id,
        driveFolderId: extraFolderId,
        title: titleWithoutPosition(file.name),
        position: 0,
        suggestedModulePosition: editorialConflict ? 1 : null,
        suggestedModuleId: null,
        suggestedModuleName: editorialConflict ? "Primeiros Passos" : null,
        suggestedContentPath: editorialConflict
          ? "Módulo 01 / posição a definir após decisão editorial"
          : "Associação manual necessária",
        cover: null,
        pdf: file,
        video: null,
        words: [],
        classifications: editorialConflict
          ? ["editorial_conflict", "missing_cover", "review"]
          : ["without_module", "missing_cover", "review"],
        editorialStatus: "draft",
        platformSituation: "Material externo à raiz oficial; ainda não comparado com o banco",
        currentFolder: "GUIAS - MATERIAL BRUTO",
        correctFolder: "A definir após decisão editorial",
        recommendedAction: editorialConflict
          ? "Não importar até decidir se é versão, complemento, Biblioteca, institucional ou arquivo"
          : "Definir módulo, posição e capa antes da importação",
        existingTargetId: null,
        selectedByDefault: false,
        alerts: ["A pasta de origem está fora da raiz oficial do Universo Atípico."],
      });
    }
  }

  if (moduleFolders.filter((folder) => (initialPosition(folder.name) ?? 0) >= 7).length)
    warnings.push("Os módulos 07 a 11 não possuem conteúdos e devem permanecer em “Em breve”.");

  return { rootFolderId, coversFolderId, extraFolderIds, candidates, ignored, warnings };
}
