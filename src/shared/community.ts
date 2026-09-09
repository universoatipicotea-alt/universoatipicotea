export const COMMUNITY_CATEGORIES = [
  "Rotina",
  "Escola",
  "Comunicação",
  "Comportamento",
  "Autocuidado",
  "Outros",
] as const;

export const COMMUNITY_SORTS = ["recentes", "respondidas", "sem-resposta"] as const;
export const COMMUNITY_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const COMMUNITY_MAX_IMAGES = 4;
export const COMMUNITY_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const COMMUNITY_FEED_PAGE_SIZE = 12;
export const COMMUNITY_COMMENT_PAGE_SIZE = 15;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];
export type CommunitySort = (typeof COMMUNITY_SORTS)[number];

type TextPolicy = {
  label: string;
  minLength: number;
  maxLength: number;
  minMeaningfulCharacters: number;
};

// eslint-disable-next-line no-control-regex -- remove controles invisíveis antes de persistir texto.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/gu;
const URL = /https?:\/\/\S+/giu;

export function normalizeCommunityText(value: unknown) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

export function meaningfulCommunityCharacters(value: unknown) {
  const normalized = normalizeCommunityText(value).replace(URL, " ");
  return normalized.match(LETTER_OR_NUMBER) ?? [];
}

export function validateCommunityText(value: unknown, policy: TextPolicy) {
  const text = normalizeCommunityText(value);
  if (text.length < policy.minLength || text.length > policy.maxLength) {
    throw new Error(
      `${policy.label} deve ter entre ${policy.minLength} e ${policy.maxLength.toLocaleString("pt-BR")} caracteres.`,
    );
  }

  const meaningful = meaningfulCommunityCharacters(text);
  const unique = new Set(meaningful.map((character) => character.toLocaleLowerCase("pt-BR")));
  if (meaningful.length < policy.minMeaningfulCharacters || unique.size < 2) {
    throw new Error(`${policy.label} precisa conter uma mensagem compreensível.`);
  }
  return text;
}

export function validateTopicTitle(value: unknown) {
  return validateCommunityText(value, {
    label: "O título",
    minLength: 5,
    maxLength: 180,
    minMeaningfulCharacters: 5,
  });
}

export function validateTopicBody(value: unknown) {
  return validateCommunityText(value, {
    label: "A conversa",
    minLength: 10,
    maxLength: 10_000,
    minMeaningfulCharacters: 10,
  });
}

export function validateCommentBody(value: unknown) {
  return validateCommunityText(value, {
    label: "A resposta",
    minLength: 2,
    maxLength: 5_000,
    minMeaningfulCharacters: 2,
  });
}

export function validateReportReason(value: unknown) {
  return validateCommunityText(value, {
    label: "O motivo da denúncia",
    minLength: 3,
    maxLength: 1_000,
    minMeaningfulCharacters: 3,
  });
}

export function parseCommunityCategory(value: unknown): CommunityCategory {
  const category = normalizeCommunityText(value);
  if (!COMMUNITY_CATEGORIES.includes(category as CommunityCategory)) {
    throw new Error("Selecione uma categoria válida.");
  }
  return category as CommunityCategory;
}

export function parseCommunitySort(value: unknown): CommunitySort {
  return COMMUNITY_SORTS.includes(value as CommunitySort) ? (value as CommunitySort) : "recentes";
}

export function boundedCommunityLimit(value: unknown, fallback: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function parsePositiveCommunityId(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${label} inválido.`);
  return parsed;
}

export function parseClientRequestId(value: unknown) {
  const id = normalizeCommunityText(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Identificador da publicação inválido.");
  }
  return id;
}
