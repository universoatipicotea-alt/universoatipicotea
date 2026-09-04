export const DRIVE_CLASSIFICATION_LABELS = {
  ready: "pronto para importar",
  missing_cover: "falta capa",
  missing_official_pdf: "falta PDF oficial",
  word_only: "somente Word",
  review: "precisa de revisão",
  duplicate: "duplicado",
  old_version: "versão antiga",
  without_module: "sem módulo definido",
  registered: "já cadastrado",
  registered_incorrectly: "cadastrado incorretamente",
  editorial_conflict: "conflito editorial — aguardando decisão",
} as const;

export const NEW_GUIDE_EDITORIAL_COMPARISON = {
  newGuide: {
    title: "Meu filho é AUTISTA. E agora?",
    objective:
      "Oferecer uma visão geral e emocional da jornada familiar após o diagnóstico, passando por observação, rede de cuidado, participação no desenvolvimento e autocuidado familiar.",
    structure: "19 páginas, seis capítulos narrativos.",
    topics:
      "Pós-diagnóstico, compreensão da criança, rede de cuidado, informações e emoções, participação no desenvolvimento e cuidado da família.",
    audience: "Famílias que receberam o diagnóstico e procuram uma introdução ampla.",
  },
  existingGuide: {
    title: "Recebi o diagnóstico. E agora?",
    objective:
      "Acolher o momento do diagnóstico e orientar os primeiros movimentos de forma prática, segura e apoiada em referências.",
    structure: "4 páginas, orientação objetiva, checklist, sinais de urgência e referências.",
    topics:
      "Significado do diagnóstico, seis primeiros movimentos, perguntas para consulta, urgências, checklist e fontes.",
    audience: "Famílias e redes de apoio no primeiro momento após o diagnóstico.",
  },
  overlap:
    "Os dois materiais tratam do pós-diagnóstico, acolhimento e construção de apoio. O novo PDF também atravessa temas que já pertencem a outros caminhos da Academia.",
  complementary:
    "O novo PDF aprofunda a experiência familiar e o cuidado ao longo da jornada; o guia existente é mais curto, acionável e tecnicamente referenciado.",
  possibleClassification:
    "Material complementar do Módulo 01 ou guia geral da Biblioteca, após revisão editorial e técnica.",
  recommendation:
    "Não substituir nem importar automaticamente. Revisar linguagem, referências, escopo e sobreposição; depois escolher entre complemento, Biblioteca, institucional ou arquivo.",
} as const;

export type DriveClassification = keyof typeof DRIVE_CLASSIFICATION_LABELS;
export type DriveAssetRole = "module_cover" | "guide_cover" | "pdf" | "video" | "word";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  modifiedTime: string | null;
  size: number | null;
  md5Checksum: string | null;
  version: string | null;
  webViewLink: string | null;
  canDownload: boolean;
};

export type DriveModuleRecord = {
  id: number;
  name: string;
  slug: string;
  position: number;
  status: string;
  driveFolderId?: string | null;
  coverImageKey?: string | null;
};

export type DriveGuideRecord = {
  id: number;
  title: string;
  moduleId: number | null;
  position: number;
  status: string;
  driveFolderId?: string | null;
  pdfKey?: string | null;
  coverImageKey?: string | null;
};

export type DriveAssetRecord = {
  driveFileId: string;
  driveModifiedAt?: string | null;
  driveVersion?: string | null;
  moduleId?: number | null;
  guideId?: number | null;
};

export type DriveImportCandidate = {
  key: string;
  targetKind: "module_cover" | "academy_guide";
  driveFileId: string;
  driveFolderId: string | null;
  title: string;
  position: number;
  suggestedModulePosition: number | null;
  suggestedModuleId: number | null;
  suggestedModuleName: string | null;
  suggestedContentPath: string;
  cover: DriveFile | null;
  pdf: DriveFile | null;
  video: DriveFile | null;
  words: DriveFile[];
  classifications: DriveClassification[];
  editorialStatus: "draft";
  platformSituation: string;
  currentFolder: string;
  correctFolder: string;
  recommendedAction: string;
  existingTargetId: number | null;
  selectedByDefault: boolean;
  alerts: string[];
};

export function extractDriveId(value: string) {
  const raw = String(value || "").trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return raw;
  const match = raw.match(/\/(?:folders|d)\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];
  throw new Error("Informe uma URL ou ID válido de pasta do Google Drive.");
}

export function normalizeDriveName(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.(pdf|docx?|png|jpe?g|webp|mp4|mov|webm)$/i, "")
    .replace(
      /\b(pdf oficial|documento editavel|minuta para aprovacao|material|capa do caminho|capa)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function initialPosition(value: string) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,3})\b/);
  return match ? Number(match[1]) : null;
}

export function titleWithoutPosition(value: string) {
  return String(value || "")
    .replace(/^\s*\d{1,3}\s*[—–_-]\s*/, "")
    .replace(/\s*[—–_-]\s*(PDF oficial|Documento editável|Minuta para aprovação)\s*\.\w+$/i, "")
    .replace(/\.(pdf|docx?|png|jpe?g|webp|mp4|mov|webm)$/i, "")
    .replace(/^MATERIAL\s*[—–_-]\s*/i, "")
    .trim();
}

export function assetRole(file: Pick<DriveFile, "mimeType">): DriveAssetRole | null {
  if (file.mimeType === "application/pdf") return "pdf";
  if (file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return "word";
  if (file.mimeType.startsWith("image/")) return "guide_cover";
  if (file.mimeType.startsWith("video/")) return "video";
  return null;
}

function sameTitle(a: string, b: string) {
  const left = normalizeDriveName(a).replace(/^\d+\s+/, "");
  const right = normalizeDriveName(b).replace(/^\d+\s+/, "");
  return Boolean(left && right && left === right);
}

export function reconcileDriveCandidates(
  candidates: DriveImportCandidate[],
  modules: DriveModuleRecord[],
  guides: DriveGuideRecord[],
  assets: DriveAssetRecord[],
) {
  return candidates.map((candidate) => {
    const module = modules.find(
      (row) =>
        row.driveFolderId === candidate.driveFolderId ||
        row.position === candidate.suggestedModulePosition ||
        sameTitle(row.name, candidate.suggestedModuleName || ""),
    );
    const asset = assets.find((row) => row.driveFileId === candidate.driveFileId);
    const guide =
      candidate.targetKind === "academy_guide"
        ? guides.find(
            (row) =>
              row.driveFolderId === candidate.driveFolderId ||
              (row.moduleId === module?.id &&
                row.position === candidate.position &&
                sameTitle(row.title, candidate.title)),
          )
        : null;
    const classifications = [...candidate.classifications];
    const alerts = [...candidate.alerts];
    let platformSituation = candidate.platformSituation;
    let recommendedAction = candidate.recommendedAction;
    let selectedByDefault = candidate.selectedByDefault;

    if (candidate.targetKind === "module_cover" && module) {
      platformSituation = module.coverImageKey
        ? "Módulo existente com capa; atualização exige confirmação"
        : "Módulo existente sem capa importada";
      recommendedAction = module.coverImageKey
        ? "Comparar a prévia e confirmar a substituição da capa"
        : "Importar a capa para o módulo existente";
    }
    if (guide) {
      candidate.existingTargetId = guide.id;
      platformSituation = guide.pdfKey
        ? "Guia já cadastrado com PDF"
        : "Guia cadastrado sem PDF correspondente";
      if (!classifications.includes("registered")) classifications.push("registered");
      recommendedAction = "Comparar o registro existente e confirmar qualquer atualização";
      selectedByDefault = false;
      if (module && guide.moduleId !== module.id) {
        classifications.push("registered_incorrectly");
        alerts.push("O guia existente está associado a outro módulo.");
      }
    }
    if (asset) {
      if (!classifications.includes("registered")) classifications.push("registered");
      platformSituation = "Arquivo do Drive já registrado na plataforma";
      selectedByDefault = false;
      const source = candidate.pdf || candidate.video || candidate.cover;
      if (
        source &&
        ((asset.driveVersion && source.version && asset.driveVersion !== source.version) ||
          (asset.driveModifiedAt &&
            source.modifiedTime &&
            asset.driveModifiedAt !== source.modifiedTime))
      ) {
        classifications.push("review");
        alerts.push("O arquivo do Drive foi modificado após a última importação.");
        recommendedAction = "Revisar e confirmar a nova versão";
      }
    }
    if (!module && candidate.suggestedModulePosition) {
      classifications.push("without_module");
      alerts.push("Nenhum módulo correspondente foi encontrado no banco.");
      selectedByDefault = false;
    }

    return {
      ...candidate,
      suggestedModuleId: module?.id ?? candidate.suggestedModuleId,
      existingTargetId: guide?.id ?? candidate.existingTargetId,
      classifications: [...new Set(classifications)],
      alerts,
      platformSituation,
      recommendedAction,
      selectedByDefault,
    };
  });
}
