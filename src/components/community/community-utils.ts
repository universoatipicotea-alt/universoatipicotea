import type {
  CommunityAttachment,
  CommunityComment,
  CommunityCommentPage,
  CommunityFeedPage,
  CommunityTopic,
  CommunityTopicDetail,
} from "./types";

export const COMMUNITY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const COMMUNITY_MAX_IMAGES = 4;
export const COMMUNITY_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function authorLabel(item: {
  authorDisplayName?: string | null;
  authorName?: string | null;
}) {
  return item.authorDisplayName || item.authorName || "Membro da comunidade";
}

export function initials(name?: string | null) {
  return (name || "UA")
    .trim()
    .split(/\s+/)
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("pt-BR");
}

export function formatCommunityDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function relativeCommunityDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data indisponível";
  const delta = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ontem" : `${days} dias`;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Não foi possível ler ${file.name}.`));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function mergeById<T extends { id: number }>(current: T[], incoming: T[]) {
  const rows = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) rows.set(item.id, item);
  return Array.from(rows.values());
}

function normalizeAttachment(value: unknown): CommunityAttachment | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = Number(item.id);
  const url = String(item.url ?? item.signedUrl ?? item.imageUrl ?? "");
  if (!Number.isFinite(id) || !url) return null;
  return {
    id,
    url,
    altText: typeof item.altText === "string" ? item.altText : null,
    mimeType: typeof item.mimeType === "string" ? item.mimeType : null,
    width: typeof item.width === "number" ? item.width : null,
    height: typeof item.height === "number" ? item.height : null,
    position: typeof item.position === "number" ? item.position : null,
  };
}

export function normalizeTopic(value: unknown): CommunityTopic {
  const item = (value ?? {}) as Record<string, unknown>;
  const rawAttachments = Array.isArray(item.attachments) ? item.attachments : [];
  return {
    ...(item as unknown as CommunityTopic),
    id: Number(item.id),
    authorId: Number(item.authorId),
    title: String(item.title ?? ""),
    body: String(item.body ?? ""),
    category: String(item.category ?? "Outros"),
    createdAt: String(item.createdAt ?? new Date(0).toISOString()),
    commentCount: Number(item.commentCount ?? 0),
    reactionCount: Number(item.reactionCount ?? item.likeCount ?? 0),
    viewerReacted: Boolean(item.viewerReacted ?? item.likedByCurrentUser),
    attachments: rawAttachments
      .map(normalizeAttachment)
      .filter((attachment): attachment is CommunityAttachment => Boolean(attachment))
      .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0)),
  };
}

export function normalizeComment(value: unknown): CommunityComment {
  const item = (value ?? {}) as Record<string, unknown>;
  return {
    ...(item as unknown as CommunityComment),
    id: Number(item.id),
    authorId: Number(item.authorId),
    body: String(item.body ?? ""),
    createdAt: String(item.createdAt ?? new Date(0).toISOString()),
    parentCommentId: item.parentCommentId ? Number(item.parentCommentId) : null,
    reactionCount: Number(item.reactionCount ?? item.likeCount ?? 0),
    viewerReacted: Boolean(
      item.viewerReacted ||
      (Array.isArray(item.viewerReactions) && item.viewerReactions.includes("support")),
    ),
  };
}

export function normalizeFeedPage(value: unknown): CommunityFeedPage {
  const data = (value ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items.map(normalizeTopic) : [];
  return {
    items,
    nextCursor: typeof data.nextCursor === "string" ? data.nextCursor : null,
  };
}

export function normalizeCommentPage(value: unknown): CommunityCommentPage {
  const data = (value ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items.map(normalizeComment) : [];
  return {
    items,
    nextCursor: typeof data.nextCursor === "string" ? data.nextCursor : null,
  };
}

export function normalizeTopicDetail(value: unknown): CommunityTopicDetail | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (!data.topic) return null;
  return {
    topic: normalizeTopic(data.topic),
    comments: Array.isArray(data.comments) ? data.comments.map(normalizeComment) : [],
    nextCommentCursor: typeof data.nextCommentCursor === "string" ? data.nextCommentCursor : null,
  };
}
