/**
 * Camada de dados do Universo Atípico.
 * Reproduz os endpoints tRPC originais sobre o banco do Lovable Cloud.
 */
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import {
  LOVABLE_CLOUD_SUPABASE_PUBLISHABLE_KEY,
  LOVABLE_CLOUD_SUPABASE_URL,
} from "@/integrations/supabase/public-config";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  isAccessRole,
  isAdminRole,
  isMasterRole,
  legacyValuesForAccessRole,
  type AccessRole,
} from "@shared/access";
import {
  COMMUNITY_COMMENT_PAGE_SIZE,
  COMMUNITY_FEED_PAGE_SIZE,
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
} from "@shared/community";
import { driveRollbackDecision, type DriveFile, type DriveImportCandidate } from "./drive-import";
import { isVisualAssetSlot } from "./visual-assets";

// Contrato público da validação: "O título deve ter entre 5 e 180 caracteres".

const PDF_BUCKET = "guias-pdf";
const IMAGE_BUCKET = "guias-capas";
const VIDEO_BUCKET = "funil-video";
const FORUM_MEDIA_BUCKET = "community-media";
const BANNER_PUBLIC_COLUMNS = "slot,desktop_url,tablet_url,mobile_url,alt_text";
const VISUAL_ASSET_PUBLIC_COLUMNS =
  "slot,desktop_image_url:desktop_url,tablet_image_url:tablet_url,mobile_image_url:mobile_url,alt_text";
const LEGACY_BANNER_SLOTS = new Set(["inicio", "receitas", "academia", "plano"]);

type UaUser = {
  id: number;
  authId: string;
  name: string | null;
  email: string | null;
  accessRole: AccessRole;
  role: "user" | "admin" | "master";
  accountStatus: "active" | "suspended";
  membershipStatus: "member" | "free" | "canceled";
  createdAt: string | null;
  lastSignedIn: string | null;
};

type UaBannerRow = {
  slot: string;
  name?: string | null;
  internal_title?: string | null;
  desktop_key?: string | null;
  desktop_url?: string | null;
  desktop_image_url?: string | null;
  tablet_key?: string | null;
  tablet_url?: string | null;
  tablet_image_url?: string | null;
  mobile_key?: string | null;
  mobile_url?: string | null;
  mobile_image_url?: string | null;
  alt_text?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
};

const db = () => supabaseAdmin as any;

function toCamel(key: string) {
  return key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

export function camel<T = any>(row: any): T {
  if (Array.isArray(row)) return row.map((item) => camel(item)) as unknown as T;
  if (!row || typeof row !== "object") return row;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) output[toCamel(key)] = value;
  return output as T;
}

function fail(message: string): never {
  throw new Error(message);
}

async function auditEvent(
  actor: UaUser,
  action: string,
  entityType: string,
  entityId: string | number | null,
  outcome: "success" | "failure" | "noop",
  metadata: Record<string, unknown> = {},
) {
  const { error } = await db()
    .from("ua_audit_events")
    .insert({
      actor_auth_id: actor.authId,
      actor_user_id: actor.id,
      action,
      entity_type: entityType,
      entity_id: entityId === null ? null : String(entityId),
      outcome,
      metadata,
    });
  if (error) console.error(`[audit] ${action}:`, error.message);
}

function requestOrigin(): string {
  const request = getRequest();
  const explicit = request?.headers.get("origin");
  if (explicit) return explicit;
  const referer = request?.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignora referer inválido
    }
  }
  const host = request?.headers.get("x-forwarded-host") ?? request?.headers.get("host");
  if (host) {
    const proto =
      request?.headers.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return "http://localhost:8080";
}

async function authUserFromRequest() {
  const request = getRequest();
  const header = request?.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const url = process.env["SUPABASE_URL"] || LOVABLE_CLOUD_SUPABASE_URL;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || LOVABLE_CLOUD_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function ensureUaUser(nameHint?: string | null): Promise<UaUser | null> {
  const authUser = await authUserFromRequest();
  if (!authUser) return null;

  const existing = await db().from("ua_users").select("*").eq("auth_id", authUser.id).maybeSingle();
  if (existing.data) {
    await db()
      .from("ua_users")
      .update({ last_signed_in: new Date().toISOString() })
      .eq("id", existing.data.id);
    return camel<UaUser>(existing.data);
  }

  const name =
    nameHint ||
    (authUser.user_metadata?.["name"] as string | undefined) ||
    authUser.email?.split("@")[0] ||
    "Novo membro";
  const inserted = await db()
    .from("ua_users")
    .insert({
      auth_id: authUser.id,
      name,
      email: authUser.email,
      access_role: "visitor",
      role: "user",
      account_status: "active",
      // Acesso pago: quem não pagou entra como visitante.
      membership_status: "canceled",
      last_signed_in: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (inserted.error) fail(inserted.error.message);
  return camel<UaUser>(inserted.data);
}

async function requireUser(nameHint?: string | null) {
  const user = await ensureUaUser(nameHint);
  if (!user) fail("Faça login para continuar.");
  if (user.accountStatus !== "active") fail("Esta conta está temporariamente suspensa.");
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminRole(user.accessRole)) fail("Acesso restrito à equipe.");
  return user;
}

async function requireMaster() {
  const user = await requireUser();
  if (!isMasterRole(user.accessRole)) fail("Acesso restrito ao Master.");
  return user;
}

async function assertMemberContent(user: UaUser) {
  const privileged = isAdminRole(user.accessRole);
  if (privileged) return;
  if (user.accessRole === "member") return;
  const { data: sub } = await db()
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.authId)
    .eq("status", "active")
    .maybeSingle();
  if (sub) return;
  fail("ACESSO_RESTRITO: este conteúdo é exclusivo para assinantes ativos.");
}

/* ------------------------------- consultas ------------------------------- */

async function countRows(table: string, filters?: Record<string, string>) {
  let query = db().from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters ?? {})) query = query.eq(column, value);
  const { count } = await query;
  return Number(count ?? 0);
}

async function getCommunityMetrics() {
  const [members, topics, guides] = await Promise.all([
    countRows("ua_users"),
    countRows("ua_forum_topics", { status: "visible" }),
    countRows("ua_guides", { status: "published" }),
  ]);
  return { members, topics, guides };
}

function bannerTableMissing(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return Boolean(
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      (message.includes("ua_banners") && message.includes("schema cache"))),
  );
}

function bannerSchemaOutdated(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return Boolean(
    error &&
    (error.code === "42703" ||
      error.code === "PGRST204" ||
      (message.includes("is_active") && message.includes("schema cache"))),
  );
}

async function listBannerRows(activeOnly: boolean, columns = BANNER_PUBLIC_COLUMNS) {
  let query = db()
    .from("ua_banners")
    .select(activeOnly ? columns : "*")
    .order("slot", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  let { data, error } = await query;
  // Compatibilidade durante a janela entre o deploy do código e a migration aditiva.
  if (activeOnly && bannerSchemaOutdated(error)) {
    const fallback = await db()
      .from("ua_banners")
      .select(columns)
      .order("slot", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }
  if (bannerTableMissing(error)) return [];
  if (error) fail("Não foi possível carregar a configuração visual.");
  return (data ?? []) as UaBannerRow[];
}

function visualAssetFromBanner(row: UaBannerRow, publicOnly: boolean) {
  const base = {
    slot: row.slot,
    desktopImageUrl: row.desktop_image_url ?? row.desktop_url ?? "",
    tabletImageUrl: row.tablet_image_url ?? row.tablet_url ?? null,
    mobileImageUrl: row.mobile_image_url ?? row.mobile_url ?? null,
    altText: row.alt_text ?? "",
  };
  if (publicOnly) return base;
  const defaultName = String(row.slot ?? "Banner").replace(/[_-]+/g, " ");
  return {
    ...base,
    name: row.name ?? defaultName,
    internalTitle: row.internal_title ?? row.name ?? defaultName,
    desktopImageKey: row.desktop_key ?? null,
    tabletImageKey: row.tablet_key ?? null,
    mobileImageKey: row.mobile_key ?? null,
    isActive: row.is_active !== false,
    createdAt: row.created_at ?? null,
    createdBy: row.created_by ?? null,
    updatedAt: row.updated_at ?? null,
    updatedBy: row.updated_by ?? null,
  };
}

async function listVisualAssets(activeOnly: boolean) {
  const rows = await listBannerRows(activeOnly, VISUAL_ASSET_PUBLIC_COLUMNS);
  return rows.map((row) => visualAssetFromBanner(row, activeOnly));
}

async function listBanners() {
  const rows = await listBannerRows(true);
  return rows.map((row) => ({
    slot: row.slot,
    desktopUrl: row.desktop_url ?? null,
    tabletUrl: row.tablet_url ?? null,
    mobileUrl: row.mobile_url ?? null,
    altText: row.alt_text ?? null,
  }));
}

function requiredVisualText(value: unknown, label: string, maxLength: number) {
  const text = String(value ?? "").trim();
  if (text.length < 2 || text.length > maxLength)
    fail(`${label} deve ter entre 2 e ${maxLength} caracteres.`);
  return text;
}

function optionalVisualText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length > maxLength) fail("Um dos campos da imagem excede o limite permitido.");
  return text;
}

function visualImageUrl(value: unknown, required: boolean) {
  const url = optionalVisualText(value, 2048);
  if (!url) {
    if (required) fail("Envie a imagem desktop antes de salvar.");
    return null;
  }
  const isLocal = url.startsWith("/") && !url.startsWith("//");
  let isHttps = false;
  try {
    isHttps = new URL(url).protocol === "https:";
  } catch {
    // Uma URL local válida não precisa ser absoluta.
  }
  if (!isLocal && !isHttps) fail("A URL da imagem não é segura.");
  return url;
}

export function slugifyPt(value: string) {
  return (
    (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "outros"
  );
}

async function listTaxonomy(kind: "recipe" | "module", includeDrafts = false) {
  const table = kind === "recipe" ? "ua_recipe_categories" : "ua_academy_modules";
  let query = db().from(table).select("*");
  if (!includeDrafts)
    query =
      kind === "module"
        ? query.in("status", ["published", "coming_soon"])
        : query.eq("status", "published");
  const { data } = await query
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  const rows = camel<any[]>(data ?? []);
  if (!includeDrafts) return rows;
  return Promise.all(
    rows.map(async (item) => ({
      ...item,
      contentCount: await countRows(kind === "recipe" ? "ua_test_guides" : "ua_guides", {
        [kind === "recipe" ? "category_id" : "module_id"]: String(item.id),
      }),
    })),
  );
}

async function listPublishedGuides() {
  const { data } = await db()
    .from("ua_guides")
    .select(
      "id,title,summary,content,category,module_id,pdf_key,cover_image_url,content_type,video_url,estimated_duration,technical_review,position,published_at,created_at",
    )
    .eq("status", "published")
    .not("module_id", "is", null)
    .order("position", { ascending: true })
    .order("published_at", { ascending: false });
  return (data ?? []).map((row: any) => {
    const { pdf_key, ...rest } = row;
    return { ...camel(rest), hasPdf: Boolean(pdf_key) };
  });
}

async function listPublicGuideCards() {
  const { data } = await db()
    .from("ua_guides")
    .select(
      "id,title,summary,category,module_id,cover_image_url,content_type,estimated_duration,technical_review,position,published_at",
    )
    .eq("status", "published")
    .not("module_id", "is", null)
    .order("position", { ascending: true })
    .order("published_at", { ascending: false });
  return camel(data ?? []);
}

async function listPublishedFacilitators() {
  const { data } = await db()
    .from("ua_facilitators")
    .select("id,title,summary,category,source_label,link_url,image_url,created_at")
    .eq("status", "published")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  return camel(data ?? []);
}

async function listPublishedProducts(featuredOnly = false) {
  let query = db()
    .from("ua_products")
    .select("id,title,slug,summary,category,cover_image_url,featured_on_home,position,created_at")
    .eq("status", "published");
  if (featuredOnly) query = query.eq("featured_on_home", true);
  const { data } = await query
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  return camel(data ?? []);
}

async function getLandingSettings() {
  const { data } = await db().from("ua_landing_settings").select("*").limit(1).maybeSingle();
  return camel(
    data ?? {
      id: 0,
      show_product_shelf: true,
      product_shelf_title: "Escolhas que podem apoiar sua jornada",
      product_shelf_description:
        "Recomendações externas escolhidas pelo Universo Atípico. Sua assinatura continua a mesma e a decisão é sempre sua.",
      updated_by: null,
      updated_at: new Date(0).toISOString(),
    },
  );
}

async function getFunnelSettings() {
  const { data } = await db().from("ua_funnel_settings").select("*").eq("id", 1).maybeSingle();
  return camel(
    data ?? {
      id: 1,
      vsl_video_path: null,
      headline: "Alimentação com mais possibilidades, sem pressão.",
      subheadline: "Uma comunidade de apoio, estratégias e materiais para famílias atípicas.",
      cta_label: "Quero fazer parte da comunidade",
      checkout_url: null,
      price_label: "R$ 49,90",
      updated_at: new Date(0).toISOString(),
    },
  );
}

async function updateFunnelSettings(input: any) {
  const master = await requireMaster();
  const values = {
    vsl_video_path: input.vslVideoPath ?? input.vsl_video_path,
    headline: input.headline?.trim(),
    subheadline: input.subheadline?.trim(),
    cta_label: input.ctaLabel?.trim() ?? input.cta_label?.trim(),
    checkout_url: input.checkoutUrl ?? input.checkout_url,
    price_label: input.priceLabel?.trim() ?? input.price_label?.trim(),
    updated_at: new Date().toISOString(),
  };
  await db()
    .from("ua_funnel_settings")
    .upsert({ id: 1, ...values }, { onConflict: "id" });
  return { success: true };
}

async function getSubscriptionStatus(user: UaUser) {
  const privileged = isAdminRole(user.accessRole);
  const { data: sub } = await db()
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.authId)
    .eq("provider", "stripe")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const currentPeriodEnd = sub?.current_period_end ?? null;
  const periodIsOpen = !currentPeriodEnd || new Date(currentPeriodEnd).getTime() > Date.now();
  const hasActive = Boolean(sub && ["active", "trialing"].includes(sub.status) && periodIsOpen);
  return {
    status: hasActive || user.accessRole === "member" ? "member" : "visitor",
    planName: "Plano Universo",
    priceCents: 4990,
    currency: "BRL" as const,
    canAccessPremium: privileged || hasActive || user.accessRole === "member",
    canCancel: !privileged && hasActive,
    cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    currentPeriodEnd,
    stripeStatus: sub?.status ?? "none",
    managedBy: "Stripe",
  };
}

async function decorateAuthors(rows: any[]) {
  const authorIds = Array.from(new Set(rows.map((row) => row.author_id).filter(Boolean)));
  if (!authorIds.length)
    return rows.map((row) => ({
      ...camel(row),
      authorName: null,
      authorDisplayName: null,
      authorAvatarUrl: null,
    }));
  const [{ data: users }, { data: profiles }] = await Promise.all([
    db().from("ua_users").select("id,name").in("id", authorIds),
    db().from("ua_profiles").select("user_id,display_name,avatar_url").in("user_id", authorIds),
  ]);
  const nameById = new Map((users ?? []).map((user: any) => [user.id, user.name]));
  const profileById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  return rows.map((row) => {
    const profile = profileById.get(row.author_id) as any;
    const { author_id, ...rest } = row;
    return {
      ...camel(rest),
      authorId: author_id,
      authorName: nameById.get(author_id) ?? null,
      authorDisplayName: profile?.display_name ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
    };
  });
}

type ForumTopicCursor = {
  pinned: boolean;
  activity: string;
  responses: number;
  id: number;
};

type ForumCommentCursor = {
  createdAt: string;
  id: number;
};

function encodeForumCursor(value: ForumTopicCursor | ForumCommentCursor) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeTopicCursor(value: unknown): ForumTopicCursor | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 512) fail("Cursor da comunidade inválido.");
  try {
    const cursor = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<ForumTopicCursor>;
    if (
      typeof cursor.pinned !== "boolean" ||
      typeof cursor.activity !== "string" ||
      Number.isNaN(Date.parse(cursor.activity)) ||
      !Number.isSafeInteger(cursor.responses) ||
      Number(cursor.responses) < 0 ||
      !Number.isSafeInteger(cursor.id) ||
      Number(cursor.id) < 1
    )
      fail("Cursor da comunidade inválido.");
    return cursor as ForumTopicCursor;
  } catch {
    fail("Cursor da comunidade inválido.");
  }
}

function decodeCommentCursor(value: unknown): ForumCommentCursor | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 512) fail("Cursor das respostas inválido.");
  try {
    const cursor = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<ForumCommentCursor>;
    if (
      typeof cursor.createdAt !== "string" ||
      Number.isNaN(Date.parse(cursor.createdAt)) ||
      !Number.isSafeInteger(cursor.id) ||
      Number(cursor.id) < 1
    )
      fail("Cursor das respostas inválido.");
    return cursor as ForumCommentCursor;
  } catch {
    fail("Cursor das respostas inválido.");
  }
}

function forumDatabaseError(error: { code?: string; message?: string } | null, fallback: string) {
  if (!error) return;
  if (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42P01") {
    fail("A atualização segura da Comunidade ainda precisa ser aplicada no Lovable Cloud.");
  }
  console.error(`[community] ${fallback}:`, error.message);
  fail(fallback);
}

function forumUpgradeMissing(error: { code?: string; message?: string } | null) {
  const text = error?.message?.toLowerCase() ?? "";
  return Boolean(
    error &&
    (error.code === "PGRST202" ||
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      error.code === "42883" ||
      text.includes("could not find the function") ||
      text.includes("schema cache")),
  );
}

async function loadForumAttachmentMap(topicIds: number[]) {
  const result = new Map<number, any[]>();
  if (!topicIds.length) return result;
  const { data, error } = await db()
    .from("ua_forum_attachments")
    .select("id,topic_id,storage_bucket,storage_key,mime_type,width,height,alt_text,position")
    .in("topic_id", topicIds)
    .eq("status", "attached")
    .order("position", { ascending: true });
  if (forumUpgradeMissing(error)) return result;
  forumDatabaseError(error, "Não foi possível carregar as imagens da comunidade.");
  const rows = data ?? [];
  if (!rows.length) return result;

  const rowsByBucket = new Map<string, any[]>();
  for (const row of rows) {
    const bucket = String(row.storage_bucket || FORUM_MEDIA_BUCKET);
    rowsByBucket.set(bucket, [...(rowsByBucket.get(bucket) ?? []), row]);
  }
  const signedByKey = new Map<string, string>();
  for (const [bucket, bucketRows] of rowsByBucket) {
    const paths = bucketRows.map((row) => String(row.storage_key));
    const signed = await db()
      .storage.from(bucket)
      .createSignedUrls(paths, 60 * 15);
    if (signed.error) {
      console.error("[community] signed images:", signed.error.message);
      continue;
    }
    for (const item of signed.data ?? []) {
      if (item.signedUrl) signedByKey.set(`${bucket}:${item.path}`, item.signedUrl);
    }
  }

  for (const row of rows) {
    const bucket = String(row.storage_bucket || FORUM_MEDIA_BUCKET);
    const url = signedByKey.get(`${bucket}:${row.storage_key}`);
    if (!url) continue;
    const topicId = Number(row.topic_id);
    const attachment = {
      id: Number(row.id),
      url,
      mimeType: row.mime_type,
      width: row.width ?? null,
      height: row.height ?? null,
      altText: row.alt_text ?? null,
      position: Number(row.position ?? 0),
    };
    result.set(topicId, [...(result.get(topicId) ?? []), attachment]);
  }
  return result;
}

async function decorateForumTopics(rows: any[], viewerUserId?: number, truncateBody = false) {
  if (!rows.length) return [];
  const topicIds = rows.map((row) => Number(row.id));
  const [authors, attachments, reactions] = await Promise.all([
    decorateAuthors(rows),
    loadForumAttachmentMap(topicIds),
    viewerUserId
      ? db()
          .from("ua_forum_topic_reactions")
          .select("topic_id")
          .eq("user_id", viewerUserId)
          .eq("reaction", "support")
          .in("topic_id", topicIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);
  if (!forumUpgradeMissing(reactions.error))
    forumDatabaseError(reactions.error, "Não foi possível carregar as reações da comunidade.");
  const reacted = new Set((reactions.data ?? []).map((row: any) => Number(row.topic_id)));
  return authors.map((topic: any) => {
    const {
      clientRequestId: _clientRequestId,
      deletedBy: _deletedBy,
      moderatedBy: _moderatedBy,
      moderationReason: _moderationReason,
      searchDocument: _searchDocument,
      ...safeTopic
    } = topic;
    return {
      ...safeTopic,
      body:
        truncateBody && String(topic.body ?? "").length > 420
          ? `${String(topic.body).slice(0, 417)}…`
          : topic.body,
      viewerIsAuthor: viewerUserId ? Number(topic.authorId) === viewerUserId : false,
      viewerReacted: reacted.has(Number(topic.id)),
      reactionCount: Number(topic.reactionCount ?? 0),
      commentCount: Number(topic.commentCount ?? 0),
      attachments: attachments.get(Number(topic.id)) ?? [],
    };
  });
}

async function listForumFeed(user: UaUser, rawInput: any, includeHidden = false) {
  const input = rawInput ?? {};
  const query = normalizeCommunityText(input.query);
  if (query.length > 100) fail("A busca deve ter no máximo 100 caracteres.");
  const category =
    !input.category || input.category === "Todos" ? null : parseCommunityCategory(input.category);
  const sort = parseCommunitySort(input.sort);
  const limit = boundedCommunityLimit(input.limit, COMMUNITY_FEED_PAGE_SIZE, 30);
  const cursor = decodeTopicCursor(input.cursor);
  const rpcResult = await db().rpc("ua_list_forum_topics", {
    p_query: query || null,
    p_category: category,
    p_sort: sort,
    p_cursor_pinned: cursor?.pinned ?? null,
    p_cursor_number: cursor?.responses ?? null,
    p_cursor_time: cursor?.activity ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: limit + 1,
    p_include_hidden: includeHidden,
  });
  let pageRows: any[];
  if (forumUpgradeMissing(rpcResult.error)) {
    let legacyQuery = db().from("ua_forum_topics").select("*");
    if (!includeHidden) legacyQuery = legacyQuery.eq("status", "visible");
    if (category) legacyQuery = legacyQuery.eq("category", category);
    const legacy = await legacyQuery
      .order("is_pinned", { ascending: false })
      .order("last_activity_at", { ascending: false })
      .limit(100);
    forumDatabaseError(legacy.error, "Não foi possível carregar as conversas.");
    const term = query.toLocaleLowerCase("pt-BR");
    pageRows = (legacy.data ?? []).filter(
      (row: any) =>
        !term || `${row.title ?? ""} ${row.body ?? ""}`.toLocaleLowerCase("pt-BR").includes(term),
    );
    if (sort === "respondidas")
      pageRows.sort((a, b) => Number(b.comment_count ?? 0) - Number(a.comment_count ?? 0));
    if (sort === "sem-resposta")
      pageRows.sort((a, b) => Number(a.comment_count ?? 0) - Number(b.comment_count ?? 0));
    if (cursor) {
      const index = pageRows.findIndex((row) => Number(row.id) === cursor.id);
      pageRows = index >= 0 ? pageRows.slice(index + 1) : [];
    }
    pageRows = pageRows.slice(0, limit + 1);
  } else {
    forumDatabaseError(rpcResult.error, "Não foi possível carregar as conversas.");
    pageRows = (rpcResult.data ?? []) as any[];
  }
  const hasNextPage = pageRows.length > limit;
  const rows = pageRows.slice(0, limit);
  const items = await decorateForumTopics(rows, user.id, true);
  const last = rows.at(-1);
  const nextCursor =
    hasNextPage && last
      ? encodeForumCursor({
          pinned: Boolean(last.is_pinned),
          activity: String(last.last_activity_at ?? last.updated_at ?? last.created_at),
          responses: Number(last.comment_count ?? 0),
          id: Number(last.id),
        })
      : null;
  return { items, nextCursor };
}

async function listTopics(includeHidden = false) {
  let query = db().from("ua_forum_topics").select("*");
  if (!includeHidden) query = query.eq("status", "visible");
  const { data } = await query
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false })
    .limit(100);
  return decorateAuthors(data ?? []);
}

async function getTopicDetail(topicId: number, includeHidden = false, viewerUserId?: number) {
  const { data: topicRow, error } = await db()
    .from("ua_forum_topics")
    .select("*")
    .eq("id", topicId)
    .maybeSingle();
  forumDatabaseError(error, "Não foi possível abrir esta conversa.");
  if (
    !topicRow ||
    (!includeHidden && (topicRow.status !== "visible" || Boolean(topicRow.deleted_at)))
  )
    return null;
  const [topic] = await decorateForumTopics([topicRow], viewerUserId);
  const commentPage = await listForumCommentsPage(
    topicId,
    viewerUserId,
    { limit: COMMUNITY_COMMENT_PAGE_SIZE },
    includeHidden,
  );
  return {
    topic,
    comments: commentPage.items,
    nextCommentCursor: commentPage.nextCursor,
  };
}

async function listForumCommentsPage(
  topicId: number,
  viewerUserId: number | undefined,
  rawInput: any,
  includeHidden = false,
) {
  const limit = boundedCommunityLimit(rawInput?.limit, COMMUNITY_COMMENT_PAGE_SIZE, 30);
  const cursor = decodeCommentCursor(rawInput?.cursor);
  const rpcResult = await db().rpc("ua_list_forum_root_comments", {
    p_topic_id: topicId,
    p_cursor_time: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: limit + 1,
    p_include_hidden: includeHidden,
  });
  let pageRows: any[];
  if (forumUpgradeMissing(rpcResult.error)) {
    let legacyQuery = db()
      .from("ua_forum_comments")
      .select("*")
      .eq("topic_id", topicId)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(100);
    if (!includeHidden) legacyQuery = legacyQuery.eq("status", "visible");
    const legacy = await legacyQuery;
    forumDatabaseError(legacy.error, "Não foi possível carregar as respostas.");
    pageRows = legacy.data ?? [];
    if (cursor) {
      const index = pageRows.findIndex((row) => Number(row.id) === cursor.id);
      pageRows = index >= 0 ? pageRows.slice(index + 1) : [];
    }
    pageRows = pageRows.slice(0, limit + 1);
  } else {
    forumDatabaseError(rpcResult.error, "Não foi possível carregar as respostas.");
    pageRows = (rpcResult.data ?? []) as any[];
  }
  const hasNextPage = pageRows.length > limit;
  const rootRows = pageRows.slice(0, limit);
  const rootIds = rootRows.map((row) => Number(row.id));
  let childRows: any[] = [];
  if (rootIds.length) {
    let childrenQuery = db()
      .from("ua_forum_comments")
      .select("*")
      .eq("topic_id", topicId)
      .in("parent_comment_id", rootIds)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(300);
    if (!includeHidden) childrenQuery = childrenQuery.eq("status", "visible");
    const children = await childrenQuery;
    forumDatabaseError(children.error, "Não foi possível carregar as respostas encadeadas.");
    childRows = children.data ?? [];
  }
  const allRows = [...rootRows, ...childRows];
  const decorated = await decorateAuthors(allRows);
  const commentIds = allRows.map((row) => Number(row.id));
  const reactions =
    viewerUserId && commentIds.length
      ? await db()
          .from("ua_forum_reactions")
          .select("comment_id,reaction")
          .eq("user_id", viewerUserId)
          .in("comment_id", commentIds)
      : { data: [] as any[], error: null };
  forumDatabaseError(reactions.error, "Não foi possível carregar as reações das respostas.");
  const viewerReactions = new Map<number, string[]>();
  for (const row of reactions.data ?? []) {
    const commentId = Number(row.comment_id);
    viewerReactions.set(commentId, [...(viewerReactions.get(commentId) ?? []), row.reaction]);
  }
  const rootAuthorById = new Map(
    decorated
      .filter((comment: any) => !comment.parentCommentId)
      .map((comment: any) => [
        Number(comment.id),
        comment.authorDisplayName || comment.authorName || "Membro da comunidade",
      ]),
  );
  const items = decorated.map((comment: any) => {
    const {
      clientRequestId: _clientRequestId,
      deletedBy: _deletedBy,
      moderatedBy: _moderatedBy,
      moderationReason: _moderationReason,
      ...safeComment
    } = comment;
    return {
      ...safeComment,
      body: comment.deletedAt ? "" : comment.body,
      isDeleted: Boolean(comment.deletedAt),
      viewerIsAuthor:
        viewerUserId && !comment.deletedAt ? Number(comment.authorId) === viewerUserId : false,
      reactionCount: Number(comment.reactionCount ?? 0),
      viewerReactions: viewerReactions.get(Number(comment.id)) ?? [],
      viewerReacted: (viewerReactions.get(Number(comment.id)) ?? []).includes("support"),
      parentAuthorName: comment.parentCommentId
        ? (rootAuthorById.get(Number(comment.parentCommentId)) ?? null)
        : null,
    };
  });
  const last = rootRows.at(-1);
  return {
    items,
    nextCursor:
      hasNextPage && last
        ? encodeForumCursor({ createdAt: String(last.created_at), id: Number(last.id) })
        : null,
  };
}

async function ensureMemberProfile(user: UaUser) {
  const existing = await db().from("ua_profiles").select("*").eq("user_id", user.id).maybeSingle();
  let profile = existing.data;
  if (!profile) {
    const inserted = await db()
      .from("ua_profiles")
      .insert({ user_id: user.id, display_name: (user.name ?? "Novo membro").slice(0, 120) })
      .select("*")
      .single();
    profile = inserted.data;
  }
  const existingPreferences = await db()
    .from("ua_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  let preferences = existingPreferences.data;
  if (!preferences) {
    const inserted = await db()
      .from("ua_preferences")
      .insert({ user_id: user.id })
      .select("*")
      .single();
    preferences = inserted.data;
  }
  return { profile: camel(profile), preferences: camel(preferences) };
}

async function listTestGuides(includeDrafts = false) {
  let query = db().from("ua_test_guides").select("*");
  if (!includeDrafts) query = query.eq("status", "published").not("category_id", "is", null);
  const { data } = await query
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []).map((row: any) => {
    const { pdf_key, pdf_url, ...rest } = row;
    return { ...camel(rest), hasPdf: Boolean(pdf_key) };
  });
}

/** Prévia pública: apenas capa, título, categoria e resumo curto. */
async function listPublicPreview() {
  const [guidesResult, recipesResult] = await Promise.all([
    db()
      .from("ua_guides")
      .select("id,title,summary,category,cover_image_url,position,published_at")
      .eq("status", "published")
      .order("position", { ascending: true })
      .limit(6),
    db()
      .from("ua_test_guides")
      .select("id,title,summary,category,cover_image_url,accent_color,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  const trim = (value: string | null) =>
    !value ? "" : value.length > 180 ? `${value.slice(0, 177)}...` : value;
  return {
    guides: (guidesResult.data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      summary: trim(row.summary),
      coverImageUrl: row.cover_image_url ?? null,
    })),
    recipes: (recipesResult.data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      summary: trim(row.summary),
      coverImageUrl: row.cover_image_url ?? null,
      accentColor: row.accent_color ?? "#0b2b26",
    })),
  };
}

/** Progresso real de leitura do usuário, com dados do conteúdo correspondente. */
async function listMemberProgress(userId: number) {
  const { data: rows } = await db()
    .from("ua_reading_progress")
    .select(
      "source_type,document_id,current_page,page_count,last_second,total_seconds,completed,last_access_at,updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  const progress = rows ?? [];
  if (!progress.length) return [];

  const guideIds = progress
    .filter((r: any) => r.source_type !== "testGuide")
    .map((r: any) => r.document_id);
  const recipeIds = progress
    .filter((r: any) => r.source_type === "testGuide")
    .map((r: any) => r.document_id);

  const [guides, recipes] = await Promise.all([
    guideIds.length
      ? db()
          .from("ua_guides")
          .select(
            "id,title,category,module_id,cover_image_url,content_type,video_url,estimated_duration,status",
          )
          .in("id", guideIds)
      : Promise.resolve({ data: [] as any[] }),
    recipeIds.length
      ? db()
          .from("ua_test_guides")
          .select("id,title,category,category_id,cover_image_url,accent_color,status")
          .in("id", recipeIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const byKey = new Map<string, any>();
  for (const row of guides.data ?? []) byKey.set(`guide:${row.id}`, row);
  for (const row of recipes.data ?? []) byKey.set(`testGuide:${row.id}`, row);

  return progress
    .map((row: any) => {
      const sourceType = row.source_type === "testGuide" ? "testGuide" : "guide";
      const content = byKey.get(`${sourceType}:${row.document_id}`);
      if (!content || content.status !== "published") return null;
      const pageCount = Number(row.page_count ?? 0);
      const currentPage = Number(row.current_page ?? 1);
      const lastSecond = Number(row.last_second ?? 0);
      const totalSeconds = Number(row.total_seconds ?? 0);
      const percent =
        pageCount > 0
          ? Math.min(100, Math.round((currentPage / pageCount) * 100))
          : totalSeconds > 0
            ? Math.min(100, Math.round((lastSecond / totalSeconds) * 100))
            : 0;
      return {
        sourceType,
        documentId: row.document_id,
        title: content.title,
        category: content.category,
        coverImageUrl: content.cover_image_url ?? null,
        accentColor: content.accent_color ?? null,
        currentPage,
        pageCount,
        lastSecond,
        totalSeconds,
        percent,
        completed: Boolean(row.completed) || percent >= 100,
        lastAccessAt: row.last_access_at ?? row.updated_at,
        updatedAt: row.updated_at,
      };
    })
    .filter(Boolean);
}

/**
 * Vídeos disponíveis para membros. Hoje só existe o vídeo do funil de vendas,
 * que não é conteúdo da área de membros: por isso a lista fica vazia até que
 * vídeos de membros sejam cadastrados.
 */
async function listMemberVideos() {
  return [] as {
    id: string;
    title: string;
    description: string;
    url: string;
    coverImageUrl: string | null;
  }[];
}

/* -------------------------------- uploads -------------------------------- */

const IMAGE_UPLOAD_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_UPLOAD_MIME_TYPES = new Set(["application/pdf"]);
const MAX_IMAGE_UPLOAD_BYTES = 6 * 1024 * 1024;
const MAX_PDF_UPLOAD_BYTES = 50 * 1024 * 1024;

function startsWithBytes(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function hasExpectedFileSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
  if (mimeType === "image/png") {
    return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === "image/webp") {
    return (
      startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  if (mimeType === "application/pdf") {
    return startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  }
  return false;
}

function decodeDataUrl(
  dataUrl: string,
  policy: { allowedMimeTypes: Set<string>; maxBytes: number },
) {
  const maxEncodedLength = Math.ceil((policy.maxBytes * 4) / 3) + 512;
  if (dataUrl.length > maxEncodedLength) fail("O arquivo excede o limite permitido.");
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) fail("Arquivo inválido.");
  const mimeType = match[1]!.toLowerCase();
  if (!policy.allowedMimeTypes.has(mimeType)) fail("Tipo de arquivo não permitido.");
  let binary = "";
  try {
    binary = atob(match[2]!);
  } catch {
    fail("Arquivo inválido.");
  }
  if (binary.length > policy.maxBytes) fail("O arquivo excede o limite permitido.");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  if (!hasExpectedFileSignature(bytes, mimeType))
    fail("O conteúdo do arquivo não corresponde ao tipo informado.");
  return { bytes, mimeType };
}

function safeName(fileName: string, mimeType: string) {
  const base =
    fileName
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "arquivo";
  const extension = mimeType.includes("pdf")
    ? "pdf"
    : mimeType.includes("png")
      ? "png"
      : mimeType.includes("webp")
        ? "webp"
        : "jpg";
  return `${base}-${Date.now()}.${extension}`;
}

async function saveUpload(
  input: { fileName: string; dataUrl: string },
  bucket: string,
  folder: string,
) {
  if (!input.fileName || input.fileName.length > 255) fail("Nome de arquivo inválido.");
  const policy =
    bucket === IMAGE_BUCKET
      ? { allowedMimeTypes: IMAGE_UPLOAD_MIME_TYPES, maxBytes: MAX_IMAGE_UPLOAD_BYTES }
      : { allowedMimeTypes: PDF_UPLOAD_MIME_TYPES, maxBytes: MAX_PDF_UPLOAD_BYTES };
  const { bytes, mimeType } = decodeDataUrl(input.dataUrl, policy);
  const key = `${folder}/${safeName(input.fileName, mimeType)}`;
  const { error } = await db()
    .storage.from(bucket)
    .upload(key, bytes, { contentType: mimeType, upsert: false });
  if (error) fail(error.message);
  if (bucket === IMAGE_BUCKET) {
    return { key, url: `/api/public/ua-image/${key}`, fileName: input.fileName };
  }
  return {
    key,
    url: `/api/protected-pdf/key/${encodeURIComponent(key)}`,
    fileName: input.fileName,
  };
}

async function consumeForumRateLimit(
  user: UaUser,
  action: string,
  limit: number,
  windowSeconds: number,
) {
  const { data, error } = await db().rpc("ua_consume_forum_rate_limit", {
    p_user_id: user.id,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  // Compatibilidade temporária durante a janela entre deploy e migration.
  if (forumUpgradeMissing(error)) return;
  forumDatabaseError(error, "Não foi possível validar esta ação com segurança.");
  if (data !== true) fail("Muitas ações em pouco tempo. Aguarde alguns minutos e tente novamente.");
}

function forumAttachmentIds(value: unknown) {
  if (value === undefined || value === null) return [] as number[];
  if (!Array.isArray(value)) fail("Seleção de imagens inválida.");
  const ids = value.map((item) => parsePositiveCommunityId(item, "Arquivo"));
  const unique = Array.from(new Set(ids));
  if (unique.length !== ids.length || unique.length > COMMUNITY_MAX_IMAGES)
    fail(`Selecione no máximo ${COMMUNITY_MAX_IMAGES} imagens diferentes.`);
  return unique;
}

async function cleanupStagedForumImages(user: UaUser) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db()
    .from("ua_forum_attachments")
    .select("id,storage_bucket,storage_key")
    .eq("uploader_id", user.id)
    .eq("status", "staged")
    .lt("created_at", cutoff)
    .limit(30);
  if (error || !data?.length) return;
  const byBucket = new Map<string, string[]>();
  for (const row of data) {
    const bucket = String(row.storage_bucket || FORUM_MEDIA_BUCKET);
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), String(row.storage_key)]);
  }
  for (const [bucket, paths] of byBucket) {
    const removed = await db().storage.from(bucket).remove(paths);
    if (removed.error) console.error("[community] stale upload cleanup:", removed.error.message);
  }
  await db()
    .from("ua_forum_attachments")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("uploader_id", user.id)
    .eq("status", "staged")
    .in(
      "id",
      data.map((row) => row.id),
    );
}

async function saveForumImage(user: UaUser, input: any) {
  await consumeForumRateLimit(user, "image.upload", 12, 60 * 60);
  await cleanupStagedForumImages(user);
  const fileName = normalizeCommunityText(input.fileName);
  if (!fileName || fileName.length > 255) fail("Nome de arquivo inválido.");
  const { bytes, mimeType } = decodeDataUrl(String(input.dataUrl ?? ""), {
    allowedMimeTypes: new Set<string>(COMMUNITY_IMAGE_MIME_TYPES),
    maxBytes: COMMUNITY_MAX_IMAGE_BYTES,
  });
  const key = `members/${user.id}/${crypto.randomUUID()}/${safeName(fileName, mimeType)}`;
  const uploaded = await db()
    .storage.from(FORUM_MEDIA_BUCKET)
    .upload(key, bytes, { contentType: mimeType, upsert: false });
  if (uploaded.error) fail("Não foi possível enviar esta imagem.");

  const inserted = await db()
    .from("ua_forum_attachments")
    .insert({
      uploader_id: user.id,
      storage_bucket: FORUM_MEDIA_BUCKET,
      storage_key: key,
      original_name: fileName,
      mime_type: mimeType,
      byte_size: bytes.byteLength,
      alt_text: normalizeCommunityText(input.altText).slice(0, 240) || null,
      status: "staged",
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    await db().storage.from(FORUM_MEDIA_BUCKET).remove([key]);
    forumDatabaseError(inserted.error, "Não foi possível registrar esta imagem.");
    fail("Não foi possível registrar esta imagem.");
  }
  const signed = await db()
    .storage.from(FORUM_MEDIA_BUCKET)
    .createSignedUrl(key, 60 * 15);
  if (signed.error || !signed.data?.signedUrl) {
    await db()
      .from("ua_forum_attachments")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", inserted.data.id)
      .eq("uploader_id", user.id);
    await db().storage.from(FORUM_MEDIA_BUCKET).remove([key]);
    fail("Não foi possível preparar a prévia desta imagem.");
  }
  await auditEvent(
    user,
    "community.image.staged",
    "forum_attachment",
    inserted.data.id,
    "success",
    {
      mimeType,
      byteSize: bytes.byteLength,
    },
  );
  return { id: Number(inserted.data.id), url: signed.data.signedUrl, mimeType };
}

async function deleteStagedForumImage(user: UaUser, attachmentId: number) {
  const { data, error } = await db()
    .from("ua_forum_attachments")
    .select("id,storage_bucket,storage_key,status")
    .eq("id", attachmentId)
    .eq("uploader_id", user.id)
    .maybeSingle();
  forumDatabaseError(error, "Não foi possível localizar esta imagem.");
  if (!data || data.status !== "staged") fail("Esta imagem não pode mais ser removida da prévia.");
  const removed = await db()
    .storage.from(String(data.storage_bucket || FORUM_MEDIA_BUCKET))
    .remove([String(data.storage_key)]);
  if (removed.error) fail("Não foi possível remover esta imagem.");
  const updated = await db()
    .from("ua_forum_attachments")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", attachmentId)
    .eq("uploader_id", user.id)
    .eq("status", "staged");
  forumDatabaseError(updated.error, "Não foi possível concluir a remoção da imagem.");
  await auditEvent(user, "community.image.discarded", "forum_attachment", attachmentId, "success");
  return { success: true };
}

async function signedPdfUrl(pdfKey: string) {
  const { data, error } = await db()
    .storage.from(PDF_BUCKET)
    .createSignedUrl(pdfKey, 60 * 30);
  if (error || !data?.signedUrl) fail("Não foi possível abrir este PDF.");
  return data.signedUrl as string;
}

function driveStorageName(file: {
  id: string;
  name: string;
  mimeType: string;
  version?: string | null;
}) {
  const extension =
    file.mimeType === "application/pdf"
      ? "pdf"
      : file.mimeType.includes("png")
        ? "png"
        : file.mimeType.includes("webp")
          ? "webp"
          : "jpg";
  const base = slugifyPt(file.name.replace(/\.[a-z0-9]+$/i, "")).slice(0, 70) || "arquivo";
  const version = String(file.version || "atual").replace(/[^a-zA-Z0-9_-]/g, "");
  return `${file.id}/${version}-${base}.${extension}`;
}

async function copyDriveAsset(
  client: {
    downloadFile: (
      id: string,
      maxBytes?: number,
    ) => Promise<{ bytes: Uint8Array; contentType: string }>;
  },
  file: { id: string; name: string; mimeType: string; version?: string | null },
  bucket: string,
  folder: string,
) {
  const allowed =
    bucket === PDF_BUCKET
      ? file.mimeType === "application/pdf"
      : ["image/jpeg", "image/png", "image/webp"].includes(file.mimeType);
  if (!allowed) fail("O tipo do arquivo do Drive não é permitido para este destino.");
  const { bytes, contentType } = await client.downloadFile(
    file.id,
    bucket === PDF_BUCKET ? 25 * 1024 * 1024 : 8 * 1024 * 1024,
  );
  const key = `${folder}/${driveStorageName(file)}`;
  const { error } = await db()
    .storage.from(bucket)
    .upload(key, bytes, {
      contentType: file.mimeType || contentType,
      upsert: true,
    });
  if (error) fail(error.message);
  return {
    key,
    url:
      bucket === IMAGE_BUCKET
        ? `/api/public/ua-image/${key}`
        : `/api/protected-pdf/key/${encodeURIComponent(key)}`,
  };
}

type DriveImportSelection = {
  itemId: number;
  moduleId?: number | null;
  title?: string;
  position?: number;
  overwriteConfirmed?: boolean;
  conflictConfirmed?: boolean;
};

type DriveImportResult = {
  targetKind: "module_cover" | "academy_guide";
  targetId: number | null;
  targetUpdatedAt: string | null;
  created: boolean;
  storage: Array<{ bucket: string; key: string }>;
};

type DriveImportRow = {
  id: number;
  drive_file_id: string;
  drive_folder_id: string | null;
  target_kind: "module_cover" | "academy_guide";
  title: string;
  position: number;
  suggested_module_id: number | null;
  existing_target_id: number | null;
  classification: string;
  prior_snapshot?: Record<string, unknown> | null;
  metadata: DriveImportCandidate & { importResult?: DriveImportResult };
};

type DriveDownloadClient = {
  downloadFile: (
    id: string,
    maxBytes?: number,
  ) => Promise<{ bytes: Uint8Array; contentType: string }>;
};

async function registerDriveAsset(input: {
  itemId: number;
  file: DriveFile;
  role: "module_cover" | "guide_cover" | "pdf" | "video";
  bucket?: string | null;
  key?: string | null;
  moduleId?: number | null;
  guideId?: number | null;
  masterId: number;
}) {
  const values = {
    import_item_id: input.itemId,
    drive_file_id: input.file.id,
    drive_folder_id: input.file.parents?.[0] ?? null,
    asset_role: input.role,
    file_name: input.file.name,
    mime_type: input.file.mimeType,
    drive_modified_at: input.file.modifiedTime ?? null,
    drive_version: input.file.version ?? null,
    checksum: input.file.md5Checksum ?? null,
    storage_bucket: input.bucket ?? null,
    storage_key: input.key ?? null,
    module_id: input.moduleId ?? null,
    guide_id: input.guideId ?? null,
    import_status: "imported",
    imported_by: input.masterId,
    imported_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };
  const { error } = await db()
    .from("ua_drive_assets")
    .upsert(values, { onConflict: "drive_file_id" });
  if (error) fail(error.message);
}

async function saveDriveImportJournal(
  row: DriveImportRow,
  priorSnapshot: Record<string, unknown> | null,
  importResult: Record<string, unknown>,
) {
  const metadata = { ...(row.metadata ?? {}), importResult };
  const { error } = await db()
    .from("ua_drive_import_items")
    .update({ prior_snapshot: priorSnapshot, metadata })
    .eq("id", row.id);
  if (error) fail(`Falha ao registrar o diário da importação: ${error.message}`);
}

async function removeImportedStorage(storage: Array<{ bucket: string; key: string }>) {
  for (const bucket of [IMAGE_BUCKET, PDF_BUCKET]) {
    const keys = storage.filter((item) => item.bucket === bucket).map((item) => item.key);
    if (!keys.length) continue;
    const removed = await db().storage.from(bucket).remove(keys);
    if (removed.error) fail(removed.error.message);
  }
}

async function compensateFailedDriveImport(itemId: number) {
  const journal = await db()
    .from("ua_drive_import_items")
    .select("id,prior_snapshot,metadata")
    .eq("id", itemId)
    .maybeSingle();
  const importResult = (
    journal.data?.metadata as { importResult?: DriveImportResult } | null | undefined
  )?.importResult;
  if (!importResult) return;
  const storage = Array.isArray(importResult.storage) ? importResult.storage : [];
  if (importResult.targetId && importResult.targetUpdatedAt) {
    const table = importResult.targetKind === "module_cover" ? "ua_academy_modules" : "ua_guides";
    const current = await db()
      .from(table)
      .select("id,status,updated_at")
      .eq("id", Number(importResult.targetId))
      .maybeSingle();
    if (current.data?.updated_at === importResult.targetUpdatedAt) {
      if (
        importResult.targetKind === "academy_guide" &&
        importResult.created &&
        current.data.status === "draft"
      ) {
        const removedTarget = await db()
          .from("ua_guides")
          .delete()
          .eq("id", Number(importResult.targetId));
        if (removedTarget.error) fail(removedTarget.error.message);
      } else {
        const restoredTarget = await db()
          .from(table)
          .update({ ...(journal.data?.prior_snapshot ?? {}), updated_at: new Date().toISOString() })
          .eq("id", Number(importResult.targetId));
        if (restoredTarget.error) fail(restoredTarget.error.message);
      }
    }
  }
  await removeImportedStorage(storage);
  const removedAssets = await db().from("ua_drive_assets").delete().eq("import_item_id", itemId);
  if (removedAssets.error) fail(removedAssets.error.message);
}

async function importDriveItem(
  master: UaUser,
  batchId: number,
  row: DriveImportRow,
  selection: DriveImportSelection,
  client: DriveDownloadClient,
) {
  const candidate = row.metadata;
  const classifications = String(row.classification || "").split(",");
  if (classifications.includes("editorial_conflict") && !selection.conflictConfirmed)
    fail("Este material possui conflito editorial e continua bloqueado.");
  const moduleId = Number(selection.moduleId ?? row.suggested_module_id ?? 0);
  if (!moduleId) fail("Selecione um módulo antes de importar.");
  const { data: moduleRow, error: moduleError } = await db()
    .from("ua_academy_modules")
    .select("id,name,status,cover_image_key,cover_image_url,drive_folder_id,updated_at")
    .eq("id", moduleId)
    .maybeSingle();
  if (moduleError || !moduleRow) fail("O módulo selecionado não existe.");
  const existingAsset = await db()
    .from("ua_drive_assets")
    .select("id")
    .eq("drive_file_id", row.drive_file_id)
    .maybeSingle();
  if (existingAsset.data && !selection.overwriteConfirmed)
    fail("Este Drive ID já foi importado. Confirme a atualização para continuar.");
  const importedStorage: Array<{ bucket: string; key: string }> = [];

  if (row.target_kind === "module_cover") {
    if (moduleRow.cover_image_key && !selection.overwriteConfirmed)
      fail("O módulo já possui capa. Confirme a substituição para continuar.");
    const cover = candidate.cover;
    if (!cover) fail("A capa do módulo não está disponível.");
    const snapshot = {
      cover_image_key: moduleRow.cover_image_key,
      cover_image_url: moduleRow.cover_image_url,
      drive_folder_id: moduleRow.drive_folder_id,
    };
    const copied = await copyDriveAsset(
      client,
      cover,
      IMAGE_BUCKET,
      `drive/imports/${batchId}/${row.id}/module-cover`,
    );
    importedStorage.push({ bucket: IMAGE_BUCKET, key: copied.key });
    await saveDriveImportJournal(row, snapshot, {
      targetKind: "module_cover",
      targetId: moduleId,
      targetUpdatedAt: null,
      created: false,
      storage: importedStorage,
    });
    const updated = await db()
      .from("ua_academy_modules")
      .update({
        cover_image_key: copied.key,
        cover_image_url: copied.url,
        drive_folder_id: row.drive_folder_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId)
      .select("id,updated_at")
      .single();
    if (updated.error || !updated.data)
      fail(updated.error?.message || "Falha ao atualizar a capa.");
    const importResult = {
      targetKind: "module_cover",
      targetId: moduleId,
      targetUpdatedAt: updated.data.updated_at,
      created: false,
      storage: importedStorage,
    };
    await saveDriveImportJournal(row, snapshot, importResult);
    await registerDriveAsset({
      itemId: row.id,
      file: cover,
      role: "module_cover",
      bucket: IMAGE_BUCKET,
      key: copied.key,
      moduleId,
      masterId: master.id,
    });
    return {
      priorSnapshot: snapshot,
      importResult,
    };
  }

  const existingTargetId = Number(row.existing_target_id || 0);
  let priorSnapshot: Record<string, unknown> | null = null;
  if (existingTargetId) {
    const existing = await db()
      .from("ua_guides")
      .select(
        "title,summary,content,category,module_id,content_type,video_url,pdf_key,pdf_url,estimated_duration,technical_review,cover_image_key,cover_image_url,status,position,published_at,drive_folder_id",
      )
      .eq("id", existingTargetId)
      .maybeSingle();
    if (existing.error || !existing.data) fail("O guia existente não foi encontrado.");
    if (!selection.overwriteConfirmed)
      fail("O guia já existe. Confirme a atualização antes de substituir seus arquivos.");
    priorSnapshot = existing.data;
  }

  const pdf = candidate.pdf;
  const cover = candidate.cover;
  const video = candidate.video;
  if (!pdf && !video) fail("Este conteúdo ainda não possui PDF oficial nem vídeo válido.");
  let copiedPdf: { key: string; url: string } | null = null;
  let copiedCover: { key: string; url: string } | null = null;
  if (pdf) {
    copiedPdf = await copyDriveAsset(
      client,
      pdf,
      PDF_BUCKET,
      `drive/imports/${batchId}/${row.id}/pdf`,
    );
    importedStorage.push({ bucket: PDF_BUCKET, key: copiedPdf.key });
  }
  if (cover) {
    copiedCover = await copyDriveAsset(
      client,
      cover,
      IMAGE_BUCKET,
      `drive/imports/${batchId}/${row.id}/cover`,
    );
    importedStorage.push({ bucket: IMAGE_BUCKET, key: copiedCover.key });
  }
  await saveDriveImportJournal(row, priorSnapshot, {
    targetKind: "academy_guide",
    targetId: existingTargetId || null,
    targetUpdatedAt: null,
    created: !existingTargetId,
    storage: importedStorage,
  });
  const values: Record<string, unknown> = {
    title: String(selection.title || row.title).trim(),
    category: moduleRow.name,
    module_id: moduleId,
    drive_folder_id: row.drive_folder_id,
    content_type: pdf ? "pdf" : "video",
    video_url: !pdf && video ? `drive:${video.id}` : null,
    pdf_key: copiedPdf?.key ?? (priorSnapshot?.pdf_key || null),
    pdf_url: copiedPdf?.url ?? (priorSnapshot?.pdf_url || null),
    cover_image_key: copiedCover?.key ?? (priorSnapshot?.cover_image_key || null),
    cover_image_url: copiedCover?.url ?? (priorSnapshot?.cover_image_url || null),
    position: Math.max(0, Number(selection.position ?? row.position ?? 0)),
    status: "draft",
    published_at: null,
    updated_at: new Date().toISOString(),
  };
  let target: { id: number; updated_at: string };
  let created = false;
  if (existingTargetId) {
    const updated = await db()
      .from("ua_guides")
      .update(values)
      .eq("id", existingTargetId)
      .select("id,updated_at")
      .single();
    if (updated.error || !updated.data)
      fail(updated.error?.message || "Falha ao atualizar o guia.");
    target = updated.data;
  } else {
    const inserted = await db()
      .from("ua_guides")
      .insert({
        ...values,
        summary:
          "Material importado do Google Drive. Revise a descrição e a revisão técnica antes de publicar.",
        content: null,
        estimated_duration: null,
        technical_review: null,
        status: "draft",
        published_at: null,
        created_by: master.id,
      })
      .select("id,updated_at")
      .single();
    if (inserted.error || !inserted.data)
      fail(inserted.error?.message || "Falha ao criar o rascunho.");
    target = inserted.data;
    created = true;
  }
  const importResult = {
    targetKind: "academy_guide",
    targetId: Number(target.id),
    targetUpdatedAt: target.updated_at,
    created,
    storage: importedStorage,
  };
  await saveDriveImportJournal(row, priorSnapshot, importResult);
  if (pdf)
    await registerDriveAsset({
      itemId: row.id,
      file: pdf,
      role: "pdf",
      bucket: PDF_BUCKET,
      key: copiedPdf?.key,
      moduleId,
      guideId: target.id,
      masterId: master.id,
    });
  if (cover)
    await registerDriveAsset({
      itemId: row.id,
      file: cover,
      role: "guide_cover",
      bucket: IMAGE_BUCKET,
      key: copiedCover?.key,
      moduleId,
      guideId: target.id,
      masterId: master.id,
    });
  if (!pdf && video)
    await registerDriveAsset({
      itemId: row.id,
      file: video,
      role: "video",
      moduleId,
      guideId: target.id,
      masterId: master.id,
    });
  return {
    priorSnapshot,
    importResult,
  };
}

async function protectedVideoUrl(value: string, guideId: number) {
  if (value.startsWith("drive:")) {
    const driveFileId = value.slice("drive:".length);
    if (!/^[a-zA-Z0-9_-]{10,}$/.test(driveFileId)) fail("Vídeo indisponível.");
    const { createDriveMediaToken } = await import("./drive-media-token.server");
    const token = createDriveMediaToken(guideId);
    return `/api/protected-drive-video/${guideId}?token=${encodeURIComponent(token)}`;
  }
  if (/^https?:\/\//i.test(value)) return value;
  const publicPrefix = "/api/public/ua-video/";
  const key = value.startsWith(publicPrefix)
    ? decodeURIComponent(value.slice(publicPrefix.length))
    : value;
  if (!key || key.includes("..") || key.startsWith("/")) fail("Vídeo indisponível.");
  const { data, error } = await db()
    .storage.from(VIDEO_BUCKET)
    .createSignedUrl(key, 60 * 15);
  if (error || !data?.signedUrl) fail("Não foi possível abrir este vídeo.");
  return data.signedUrl as string;
}

/* ------------------------------- dispatcher ------------------------------ */

export async function dispatch(path: string, rawInput: unknown): Promise<unknown> {
  const input = (rawInput ?? {}) as any;

  switch (path) {
    /* ---------------------------------- auth --------------------------------- */
    case "auth.ensure": {
      const user = await ensureUaUser(input.name);
      if (!user) fail("Sessão não encontrada.");
      await ensureMemberProfile(user);
      return user;
    }
    case "auth.me": {
      const user = await ensureUaUser();
      if (!user) return null;
      return user;
    }

    /* -------------------------------- público -------------------------------- */
    case "community.landing": {
      const [metrics, guides, facilitators, featuredProducts, landingSettings, preview] =
        await Promise.all([
          getCommunityMetrics(),
          listPublicGuideCards(),
          listPublishedFacilitators(),
          listPublishedProducts(true),
          getLandingSettings(),
          listPublicPreview(),
        ]);
      return {
        metrics,
        guides: guides.slice(0, 3),
        facilitators: facilitators.slice(0, 3),
        featuredProducts: featuredProducts.slice(0, 3),
        landingSettings,
        preview,
      };
    }

    case "community.visualAssets.active":
      // Endpoint público somente-leitura: não devolve chaves, títulos internos ou auditoria.
      return listVisualAssets(true);
    case "community.banners":
      return listBanners();
    case "community.master.saveBanner": {
      const master = await requireMaster();
      const slot = String(input.slot || "").trim();
      if (!isVisualAssetSlot(slot) && !LEGACY_BANNER_SLOTS.has(slot))
        fail("Informe um espaço de imagem válido.");
      const values = {
        slot,
        desktop_url: visualImageUrl(input.desktopUrl, false),
        tablet_url: visualImageUrl(input.tabletUrl, false),
        mobile_url: visualImageUrl(input.mobileUrl, false),
        alt_text: optionalVisualText(input.altText, 240),
        updated_by: master.authId,
        updated_at: new Date().toISOString(),
      };
      const saved = await db()
        .from("ua_banners")
        .upsert(values, { onConflict: "slot" })
        .select("slot")
        .single();
      if (saved.error) {
        await auditEvent(master, "banner.save", "banner", slot, "failure", {
          reason: "database_write_failed",
        });
        fail("Não foi possível salvar a configuração visual.");
      }
      await auditEvent(master, "banner.save", "banner", slot, "success");
      return { success: true };
    }

    case "community.funnel.get":
      return getFunnelSettings();
    case "community.funnel.update":
      return updateFunnelSettings(input);
    case "community.taxonomy":
      return {
        recipeCategories: await listTaxonomy("recipe", false),
        academyModules: await listTaxonomy("module", false),
      };
    case "community.publicGuides":
      return listPublicGuideCards();
    case "community.publicAcademiaGuides":
      await assertMemberContent(await requireUser());
      return listTestGuides(false);
    case "community.forum.list": {
      const user = await requireUser();
      await assertMemberContent(user);
      return (await listForumFeed(user, { limit: 30 }, false)).items;
    }
    case "community.forum.feed": {
      const user = await requireUser();
      await assertMemberContent(user);
      return listForumFeed(user, input, false);
    }
    case "community.forum.detail": {
      const user = await requireUser();
      await assertMemberContent(user);
      return getTopicDetail(parsePositiveCommunityId(input.topicId, "Conversa"), false, user.id);
    }
    case "community.forum.comments.list": {
      const user = await requireUser();
      await assertMemberContent(user);
      const topicId = parsePositiveCommunityId(input.topicId, "Conversa");
      const { data: topic, error } = await db()
        .from("ua_forum_topics")
        .select("id")
        .eq("id", topicId)
        .eq("status", "visible")
        .is("deleted_at", null)
        .maybeSingle();
      forumDatabaseError(error, "Não foi possível abrir esta conversa.");
      if (!topic) fail("Esta conversa não está disponível.");
      return listForumCommentsPage(topicId, user.id, input, false);
    }
    case "community.products.resolve": {
      const { data: product } = await db()
        .from("ua_products")
        .select("id,title,external_url")
        .eq("slug", input.slug)
        .eq("status", "published")
        .maybeSingle();
      if (!product) fail("Produto não encontrado ou indisponível.");
      let campaign: any = null;
      if (input.campaign) {
        const { data } = await db()
          .from("ua_campaigns")
          .select("id,slug,landing_url")
          .eq("slug", input.campaign)
          .eq("product_id", product.id)
          .eq("status", "active")
          .maybeSingle();
        campaign = data;
      }
      await db()
        .from("ua_product_clicks")
        .insert({
          product_id: product.id,
          origin: input.origin,
          campaign: campaign?.slug ?? null,
          campaign_id: campaign?.id ?? null,
        });
      return {
        id: product.id,
        title: product.title,
        externalUrl: campaign?.landing_url || product.external_url,
      };
    }

    /* -------------------------------- membro --------------------------------- */
    case "community.memberDashboard": {
      const user = await requireUser();
      await assertMemberContent(user);
      const { profile, preferences } = await ensureMemberProfile(user);
      const [guides, recipes, facilitators, products, recentTopics, metrics, progress, videos] =
        await Promise.all([
          listPublishedGuides(),
          listTestGuides(false),
          listPublishedFacilitators(),
          listPublishedProducts(),
          listTopics(false),
          getCommunityMetrics(),
          listMemberProgress(user.id),
          listMemberVideos(),
        ]);
      return {
        profile,
        preferences,
        guides,
        recipes,
        facilitators,
        products,
        recentTopics: recentTopics.slice(0, 4),
        metrics,
        progress,
        videos,
      };
    }
    case "billing.createCheckout": {
      // Pagamento pode ser iniciado sem conta: a conta é criada após o pagamento.
      const user = await ensureUaUser();
      const { createCheckoutSession } = await import("./billing.server");
      return createCheckoutSession({
        authId: user?.authId ?? null,
        email: user?.email ?? null,
        name: user?.name ?? null,
        origin: requestOrigin(),
      });
    }
    case "billing.activate": {
      // Único caminho de criação de conta: exige pagamento confirmado.
      const sessionId = String(input?.sessionId ?? "");
      const name = String(input?.name ?? "").trim();
      const password = String(input?.password ?? "");
      if (!sessionId) fail("Sessão de pagamento inválida.");
      if (name.length < 2) fail("Informe seu nome.");
      const { activateAccountFromSession } = await import("./billing.server");
      return activateAccountFromSession({ sessionId, name, password });
    }
    case "billing.session": {
      const sessionId = String(input?.sessionId ?? "");
      if (!sessionId) fail("Sessão de pagamento inválida.");
      const { getCheckoutSessionInfo } = await import("./billing.server");
      return getCheckoutSessionInfo(sessionId);
    }

    case "billing.sync": {
      const user = await requireUser();
      const { syncSubscription } = await import("./billing.server");
      return syncSubscription({
        authId: user.authId,
        email: user.email,
        sessionId: input?.sessionId ?? null,
      });
    }
    case "billing.portal": {
      const user = await requireUser();
      const { createPortalSession } = await import("./billing.server");
      return createPortalSession({ email: user.email, origin: requestOrigin() });
    }
    case "community.subscription.me":
      return getSubscriptionStatus(await requireUser());
    case "community.subscription.cancel": {
      const user = await requireUser();
      if (user.accessRole !== "member")
        fail("Contas administrativas não gerenciam cobrança por esta tela.");
      const { changeSubscriptionRenewal } = await import("./billing.server");
      return changeSubscriptionRenewal({
        authId: user.authId,
        userId: user.id,
        cancelAtPeriodEnd: true,
      });
    }
    case "community.subscription.resume": {
      const user = await requireUser();
      if (user.accessRole !== "member")
        fail("Contas administrativas não gerenciam cobrança por esta tela.");
      const { changeSubscriptionRenewal } = await import("./billing.server");
      return changeSubscriptionRenewal({
        authId: user.authId,
        userId: user.id,
        cancelAtPeriodEnd: false,
      });
    }
    case "community.profile.me":
      return ensureMemberProfile(await requireUser());
    case "community.profile.update": {
      const user = await requireUser();
      await ensureMemberProfile(user);
      const { data } = await db()
        .from("ua_profiles")
        .update({
          display_name: input.displayName,
          bio: input.bio ?? null,
          avatar_key: input.avatarKey ?? null,
          avatar_url: input.avatarUrl ?? null,
        })
        .eq("user_id", user.id)
        .select("*")
        .single();
      return camel(data);
    }
    case "community.preferences.update": {
      const user = await requireUser();
      await ensureMemberProfile(user);
      const { data } = await db()
        .from("ua_preferences")
        .update({
          notify_guides: input.notifyGuides,
          notify_replies: input.notifyReplies,
          notify_community: input.notifyCommunity,
        })
        .eq("user_id", user.id)
        .select("*")
        .single();
      return camel(data);
    }
    case "community.testGuides.list": {
      await assertMemberContent(await requireUser());
      return listTestGuides(false);
    }
    case "community.testGuides.read": {
      await assertMemberContent(await requireUser());
      const { data } = await db()
        .from("ua_test_guides")
        .select("*")
        .eq("id", Number(input.id))
        .maybeSingle();
      return data ? camel(data) : null;
    }
    case "community.forum.uploadImage": {
      const user = await requireUser();
      await assertMemberContent(user);
      return saveForumImage(user, input);
    }
    case "community.forum.deleteImage": {
      const user = await requireUser();
      await assertMemberContent(user);
      const attachmentId = parsePositiveCommunityId(input.attachmentId, "Arquivo");
      const attachment = await db()
        .from("ua_forum_attachments")
        .select("id,storage_bucket,storage_key,status")
        .eq("id", attachmentId)
        .eq("uploader_id", user.id)
        .maybeSingle();
      forumDatabaseError(attachment.error, "Não foi possível localizar esta imagem.");
      if (!attachment.data || attachment.data.status !== "staged")
        fail("Esta imagem não pode mais ser removida por aqui.");
      const removed = await db()
        .storage.from(attachment.data.storage_bucket || FORUM_MEDIA_BUCKET)
        .remove([attachment.data.storage_key]);
      if (removed.error) fail("Não foi possível remover esta imagem.");
      const updated = await db()
        .from("ua_forum_attachments")
        .update({ status: "deleted", deleted_at: new Date().toISOString() })
        .eq("id", attachmentId)
        .eq("uploader_id", user.id)
        .eq("status", "staged");
      forumDatabaseError(updated.error, "Não foi possível concluir a remoção da imagem.");
      await auditEvent(
        user,
        "community.image.deleted",
        "forum_attachment",
        attachmentId,
        "success",
      );
      return { success: true };
    }
    case "community.forum.createTopic": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "topic.create", 5, 60 * 60);
      const title = validateTopicTitle(input.title);
      const body = validateTopicBody(input.body);
      const category = parseCommunityCategory(input.category);
      const clientRequestId = parseClientRequestId(input.clientRequestId);
      const attachmentIds = forumAttachmentIds(input.attachmentIds);
      let created = await db().rpc("ua_create_forum_topic", {
        p_author_id: user.id,
        p_title: title,
        p_body: body,
        p_category: category,
        p_client_request_id: clientRequestId,
        p_attachment_ids: attachmentIds,
      });
      if (forumUpgradeMissing(created.error) && attachmentIds.length === 0) {
        const legacy = await db()
          .from("ua_forum_topics")
          .insert({ author_id: user.id, title, body, category, status: "visible" })
          .select("id")
          .single();
        created = { data: legacy.data?.id ?? null, error: legacy.error };
      }
      forumDatabaseError(created.error, "Não foi possível publicar esta conversa.");
      const topicId = Number(created.data);
      if (!Number.isSafeInteger(topicId) || topicId < 1)
        fail("Não foi possível confirmar a publicação.");
      await auditEvent(user, "community.topic.created", "forum_topic", topicId, "success", {
        category,
        attachmentCount: attachmentIds.length,
      });
      return { success: true, topicId };
    }
    case "community.forum.updateTopic": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "topic.update", 20, 10 * 60);
      const topicId = parsePositiveCommunityId(input.topicId, "Conversa");
      const title = validateTopicTitle(input.title);
      const body = validateTopicBody(input.body);
      const category = parseCommunityCategory(input.category);
      const existing = await db()
        .from("ua_forum_topics")
        .select("id,author_id,status,deleted_at")
        .eq("id", topicId)
        .maybeSingle();
      forumDatabaseError(existing.error, "Não foi possível localizar esta conversa.");
      if (
        !existing.data ||
        existing.data.author_id !== user.id ||
        existing.data.status !== "visible" ||
        existing.data.deleted_at
      )
        fail("Você não pode editar esta conversa.");
      const updated = await db()
        .from("ua_forum_topics")
        .update({
          title,
          body,
          category,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId)
        .eq("author_id", user.id)
        .eq("status", "visible");
      forumDatabaseError(updated.error, "Não foi possível atualizar esta conversa.");
      await auditEvent(user, "community.topic.updated", "forum_topic", topicId, "success");
      return { success: true };
    }
    case "community.forum.deleteTopic": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "topic.delete", 10, 60 * 60);
      const topicId = parsePositiveCommunityId(input.topicId, "Conversa");
      const existing = await db()
        .from("ua_forum_topics")
        .select("id,author_id,status,deleted_at")
        .eq("id", topicId)
        .maybeSingle();
      forumDatabaseError(existing.error, "Não foi possível localizar esta conversa.");
      if (
        !existing.data ||
        existing.data.author_id !== user.id ||
        existing.data.status !== "visible" ||
        existing.data.deleted_at
      )
        fail("Você não pode remover esta conversa.");
      const hidden = await db()
        .from("ua_forum_topics")
        .update({
          status: "hidden",
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId)
        .eq("author_id", user.id)
        .eq("status", "visible");
      forumDatabaseError(hidden.error, "Não foi possível remover esta conversa.");
      const attachments = await db()
        .from("ua_forum_attachments")
        .select("id,storage_bucket,storage_key")
        .eq("topic_id", topicId)
        .eq("status", "attached");
      if (!attachments.error && attachments.data?.length) {
        const byBucket = new Map<string, string[]>();
        for (const attachment of attachments.data) {
          const bucket = String(attachment.storage_bucket || FORUM_MEDIA_BUCKET);
          byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), String(attachment.storage_key)]);
        }
        for (const [bucket, paths] of byBucket) {
          const removed = await db().storage.from(bucket).remove(paths);
          if (removed.error)
            console.error("[community] topic attachment delete:", removed.error.message);
        }
        const deletedAttachments = await db()
          .from("ua_forum_attachments")
          .update({ status: "deleted", deleted_at: new Date().toISOString() })
          .eq("topic_id", topicId)
          .eq("status", "attached");
        if (deletedAttachments.error)
          console.error(
            "[community] attachment metadata delete:",
            deletedAttachments.error.message,
          );
      }
      await auditEvent(user, "community.topic.deleted", "forum_topic", topicId, "success");
      return { success: true };
    }
    case "community.forum.toggleTopicReaction": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "reaction.toggle", 120, 10 * 60);
      const topicId = parsePositiveCommunityId(input.topicId, "Conversa");
      const result = await db().rpc("ua_toggle_forum_topic_reaction", {
        p_topic_id: topicId,
        p_user_id: user.id,
        p_reaction: "support",
      });
      forumDatabaseError(result.error, "Não foi possível registrar sua reação.");
      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      return {
        active: Boolean(row?.active),
        reactionCount: Number(row?.reaction_count ?? row?.reactionCount ?? 0),
      };
    }
    case "community.forum.addComment": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "comment.create", 30, 10 * 60);
      const topicId = parsePositiveCommunityId(input.topicId, "Conversa");
      const body = validateCommentBody(input.body);
      const clientRequestId = input.clientRequestId
        ? parseClientRequestId(input.clientRequestId)
        : crypto.randomUUID();
      const topicResult = await db()
        .from("ua_forum_topics")
        .select("id,status,deleted_at")
        .eq("id", topicId)
        .maybeSingle();
      forumDatabaseError(topicResult.error, "Não foi possível localizar esta conversa.");
      const topic = topicResult.data;
      if (!topic || topic.status !== "visible" || topic.deleted_at)
        fail("Este tópico não está disponível para comentários.");
      const parentCommentId = input.parentCommentId
        ? parsePositiveCommunityId(input.parentCommentId, "Resposta")
        : null;
      if (parentCommentId) {
        const parentResult = await db()
          .from("ua_forum_comments")
          .select("id,topic_id,parent_comment_id,status,deleted_at")
          .eq("id", parentCommentId)
          .maybeSingle();
        forumDatabaseError(
          parentResult.error,
          "Não foi possível localizar a resposta selecionada.",
        );
        const parent = parentResult.data;
        if (
          !parent ||
          parent.topic_id !== topic.id ||
          parent.parent_comment_id ||
          parent.status !== "visible" ||
          parent.deleted_at
        )
          fail("A resposta selecionada não está mais disponível.");
      }
      const existing = await db()
        .from("ua_forum_comments")
        .select("id")
        .eq("author_id", user.id)
        .eq("client_request_id", clientRequestId)
        .maybeSingle();
      if (existing.data) return { success: true, commentId: Number(existing.data.id) };
      const inserted = await db()
        .from("ua_forum_comments")
        .insert({
          topic_id: topic.id,
          parent_comment_id: parentCommentId,
          body,
          author_id: user.id,
          client_request_id: clientRequestId,
        })
        .select("id")
        .single();
      if (inserted.error?.code === "23505") {
        const duplicate = await db()
          .from("ua_forum_comments")
          .select("id")
          .eq("author_id", user.id)
          .eq("client_request_id", clientRequestId)
          .maybeSingle();
        if (duplicate.data) return { success: true, commentId: Number(duplicate.data.id) };
      }
      forumDatabaseError(inserted.error, "Não foi possível publicar sua resposta.");
      const commentId = Number(inserted.data?.id);
      await auditEvent(user, "community.comment.created", "forum_comment", commentId, "success", {
        topicId,
        parentCommentId,
      });
      return { success: true, commentId };
    }
    case "community.forum.toggleReaction": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "reaction.toggle", 120, 10 * 60);
      const commentId = parsePositiveCommunityId(input.commentId, "Resposta");
      const reaction = ["support", "helpful", "heart"].includes(String(input.reaction))
        ? String(input.reaction)
        : "support";
      const result = await db().rpc("ua_toggle_forum_comment_reaction", {
        p_comment_id: commentId,
        p_user_id: user.id,
        p_reaction: reaction,
      });
      forumDatabaseError(result.error, "Não foi possível registrar sua reação.");
      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      return {
        active: Boolean(row?.active),
        reactionCount: Number(row?.reaction_count ?? row?.reactionCount ?? 0),
      };
    }
    case "community.forum.updateComment": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "comment.update", 30, 10 * 60);
      const commentId = parsePositiveCommunityId(input.commentId, "Resposta");
      const body = validateCommentBody(input.body);
      const existing = await db()
        .from("ua_forum_comments")
        .select("id,author_id,status,deleted_at")
        .eq("id", commentId)
        .maybeSingle();
      forumDatabaseError(existing.error, "Não foi possível localizar esta resposta.");
      const comment = existing.data;
      if (
        !comment ||
        comment.status !== "visible" ||
        comment.deleted_at ||
        comment.author_id !== user.id
      )
        fail("Você não pode editar esta resposta.");
      const updated = await db()
        .from("ua_forum_comments")
        .update({ body, edited_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", comment.id)
        .eq("author_id", user.id)
        .eq("status", "visible");
      forumDatabaseError(updated.error, "Não foi possível atualizar esta resposta.");
      await auditEvent(user, "community.comment.updated", "forum_comment", commentId, "success");
      return { success: true };
    }
    case "community.forum.deleteComment": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "comment.delete", 20, 60 * 60);
      const commentId = parsePositiveCommunityId(input.commentId, "Resposta");
      const existing = await db()
        .from("ua_forum_comments")
        .select("id,author_id,status,parent_comment_id,deleted_at,body")
        .eq("id", commentId)
        .maybeSingle();
      forumDatabaseError(existing.error, "Não foi possível localizar esta resposta.");
      const comment = existing.data;
      if (
        !comment ||
        comment.status !== "visible" ||
        comment.deleted_at ||
        comment.author_id !== user.id
      )
        fail("Você não pode remover esta resposta.");
      const children = await db()
        .from("ua_forum_comments")
        .select("id", { count: "exact", head: true })
        .eq("parent_comment_id", commentId)
        .eq("status", "visible");
      forumDatabaseError(children.error, "Não foi possível verificar as respostas relacionadas.");
      const keepPlaceholder = !comment.parent_comment_id && Number(children.count ?? 0) > 0;
      const deleted = await db()
        .from("ua_forum_comments")
        .update({
          body: keepPlaceholder ? "[Resposta removida pelo autor]" : comment.body,
          status: keepPlaceholder ? "visible" : "hidden",
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("author_id", user.id)
        .eq("status", "visible");
      forumDatabaseError(deleted.error, "Não foi possível remover esta resposta.");
      await auditEvent(user, "community.comment.deleted", "forum_comment", commentId, "success", {
        keptReplyContext: keepPlaceholder,
      });
      return { success: true };
    }
    case "community.forum.report": {
      const user = await requireUser();
      await assertMemberContent(user);
      await consumeForumRateLimit(user, "report.create", 10, 60 * 60);
      const reason = validateReportReason(input.reason);
      const topicId = input.topicId ? parsePositiveCommunityId(input.topicId, "Conversa") : null;
      const commentId = input.commentId
        ? parsePositiveCommunityId(input.commentId, "Resposta")
        : null;
      if (Boolean(topicId) === Boolean(commentId))
        fail("Selecione apenas um conteúdo para denunciar.");
      const target = topicId
        ? await db()
            .from("ua_forum_topics")
            .select("id,author_id,status,deleted_at")
            .eq("id", topicId)
            .maybeSingle()
        : await db()
            .from("ua_forum_comments")
            .select("id,author_id,status,deleted_at")
            .eq("id", commentId)
            .maybeSingle();
      forumDatabaseError(target.error, "Não foi possível localizar o conteúdo denunciado.");
      if (!target.data || target.data.status !== "visible" || target.data.deleted_at)
        fail("Este conteúdo não está mais disponível.");
      if (target.data.author_id === user.id)
        fail("Você não precisa denunciar seu próprio conteúdo.");
      const inserted = await db().from("ua_forum_reports").insert({
        reporter_id: user.id,
        topic_id: topicId,
        comment_id: commentId,
        reason,
      });
      if (inserted.error && inserted.error.code !== "23505")
        forumDatabaseError(inserted.error, "Não foi possível enviar a denúncia.");
      await auditEvent(
        user,
        "community.report.created",
        topicId ? "forum_topic" : "forum_comment",
        topicId ?? commentId,
        inserted.error?.code === "23505" ? "noop" : "success",
      );
      return { success: true, duplicate: inserted.error?.code === "23505" };
    }
    case "community.forum.downloadGuide": {
      const user = await requireUser();
      await assertMemberContent(user);
      const { data: guide } = await db()
        .from("ua_guides")
        .select("id,status,pdf_key")
        .eq("id", Number(input.guideId))
        .maybeSingle();
      const privileged = isAdminRole(user.accessRole);
      if (!guide?.pdf_key || (guide.status !== "published" && !privileged))
        fail("Guia não encontrado.");
      return { url: await signedPdfUrl(guide.pdf_key) };
    }

    /* --------------------------- leitura protegida --------------------------- */
    case "community.pdfSource": {
      const user = await requireUser();
      const table = input.sourceType === "testGuide" ? "ua_test_guides" : "ua_guides";
      await assertMemberContent(user);
      const { data } = await db()
        .from(table)
        .select("id,status,pdf_key")
        .eq("id", Number(input.documentId))
        .maybeSingle();
      const privileged = isAdminRole(user.accessRole);
      if (!data?.pdf_key || (data.status !== "published" && !privileged))
        fail("Conteúdo indisponível.");
      return { url: await signedPdfUrl(data.pdf_key) };
    }
    case "community.videoSource": {
      const user = await requireUser();
      await assertMemberContent(user);
      const { data } = await db()
        .from("ua_guides")
        .select("id,status,content_type,video_url")
        .eq("id", Number(input.documentId))
        .maybeSingle();
      const privileged = isAdminRole(user.accessRole);
      if (
        !data?.video_url ||
        data.content_type !== "video" ||
        (data.status !== "published" && !privileged)
      )
        fail("Conteúdo indisponível.");
      return { url: await protectedVideoUrl(data.video_url, Number(data.id)) };
    }
    case "community.readingProgress.get": {
      const user = await requireUser();
      await assertMemberContent(user);
      const { data } = await db()
        .from("ua_reading_progress")
        .select("current_page,page_count,updated_at")
        .eq("user_id", user.id)
        .eq("source_type", input.sourceType)
        .eq("document_id", Number(input.documentId))
        .maybeSingle();
      return data ? camel(data) : null;
    }
    case "community.readingProgress.save": {
      const user = await requireUser();
      await assertMemberContent(user);
      const { data: existing } = await db()
        .from("ua_reading_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("source_type", input.sourceType)
        .eq("document_id", Number(input.documentId))
        .maybeSingle();
      const values = {
        current_page: input.currentPage,
        page_count: input.pageCount,
        updated_at: new Date().toISOString(),
      };
      if (existing) await db().from("ua_reading_progress").update(values).eq("id", existing.id);
      else
        await db()
          .from("ua_reading_progress")
          .insert({
            user_id: user.id,
            source_type: input.sourceType,
            document_id: Number(input.documentId),
            ...values,
          });
      return { currentPage: input.currentPage, pageCount: input.pageCount };
    }
    case "community.videoProgress.save": {
      const user = await requireUser();
      await assertMemberContent(user);
      const documentId = Number(input.documentId);
      const lastSecond = Math.max(0, Math.floor(Number(input.lastSecond) || 0));
      const totalSeconds = Math.max(lastSecond, Math.floor(Number(input.totalSeconds) || 0));
      const completed =
        Boolean(input.completed) || (totalSeconds > 0 && lastSecond / totalSeconds >= 0.95);
      const { data: existing } = await db()
        .from("ua_reading_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("source_type", "guide")
        .eq("document_id", documentId)
        .maybeSingle();
      const values = {
        last_second: lastSecond,
        total_seconds: totalSeconds,
        completed,
        last_access_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (existing) await db().from("ua_reading_progress").update(values).eq("id", existing.id);
      else
        await db()
          .from("ua_reading_progress")
          .insert({
            user_id: user.id,
            source_type: "guide",
            document_id: documentId,
            current_page: 1,
            page_count: 1,
            ...values,
          });
      return { lastSecond, totalSeconds, completed };
    }
    case "community.annotations.list": {
      const user = await requireUser();
      await assertMemberContent(user);
      const { data } = await db()
        .from("ua_pdf_annotations")
        .select("*")
        .eq("user_id", user.id)
        .eq("source_type", input.sourceType)
        .eq("document_id", Number(input.documentId))
        .order("page_number", { ascending: true })
        .order("updated_at", { ascending: false });
      return camel(data ?? []);
    }
    case "community.annotations.create": {
      const user = await requireUser();
      await assertMemberContent(user);
      const { data, error } = await db()
        .from("ua_pdf_annotations")
        .insert({
          user_id: user.id,
          source_type: input.sourceType,
          document_id: Number(input.documentId),
          page_number: input.pageNumber,
          note: input.note,
        })
        .select("*")
        .single();
      if (error) fail(error.message);
      return camel(data);
    }
    case "community.annotations.update": {
      const user = await requireUser();
      const { data } = await db()
        .from("ua_pdf_annotations")
        .update({ note: input.note, updated_at: new Date().toISOString() })
        .eq("id", Number(input.id))
        .eq("user_id", user.id)
        .select("*")
        .maybeSingle();
      return data ? camel(data) : null;
    }
    case "community.annotations.delete": {
      const user = await requireUser();
      await db()
        .from("ua_pdf_annotations")
        .delete()
        .eq("id", Number(input.id))
        .eq("user_id", user.id);
      return { id: Number(input.id) };
    }

    /* -------------------------------- uploads -------------------------------- */
    case "community.files.uploadAvatar": {
      const user = await requireUser();
      return saveUpload(input, IMAGE_BUCKET, `members/${user.id}/avatars`);
    }
    case "community.files.uploadContentImage": {
      const user = await requireAdmin();
      return saveUpload(input, IMAGE_BUCKET, `community/content/${user.id}/images`);
    }
    case "community.files.uploadGuidePdf": {
      const user = await requireAdmin();
      return saveUpload(input, PDF_BUCKET, `community/guides/${user.id}/pdfs`);
    }
    /**
     * PDFs grandes (25–50 MB) não cabem numa requisição embutida em base64.
     * Aqui devolvemos uma URL assinada para o navegador enviar direto ao
     * armazenamento privado; o servidor só registra a chave depois.
     */
    case "community.files.signedPdfUpload": {
      const user = await requireAdmin();
      const key = `community/guides/${user.id}/pdfs/${safeName(String(input.fileName ?? "material.pdf"), "application/pdf")}`;
      const { data, error } = await db().storage.from(PDF_BUCKET).createSignedUploadUrl(key);
      if (error || !data) fail(error?.message ?? "Não foi possível preparar o envio.");
      return {
        key,
        token: data!.token,
        signedUrl: data!.signedUrl,
        url: `/api/protected-pdf/key/${encodeURIComponent(key)}`,
      };
    }

    /* --------------------------------- admin --------------------------------- */
    case "community.admin.dashboard": {
      await requireAdmin();
      const [members, guideCount, facilitatorCount, topicCount, commentCount, reportCount] =
        await Promise.all([
          countRows("ua_users"),
          countRows("ua_guides"),
          countRows("ua_facilitators"),
          countRows("ua_forum_topics"),
          countRows("ua_forum_comments"),
          countRows("ua_forum_reports", { status: "open" }),
        ]);
      const [{ data: guides }, { data: facilitators }, topics, { data: reports }] =
        await Promise.all([
          db()
            .from("ua_guides")
            .select("*")
            .order("status", { ascending: true })
            .order("position", { ascending: true }),
          db()
            .from("ua_facilitators")
            .select("*")
            .order("status", { ascending: true })
            .order("position", { ascending: true }),
          listTopics(true),
          db()
            .from("ua_forum_reports")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);
      const commentIds = (reports ?? [])
        .map((report) => report.comment_id)
        .filter((id): id is number => Number.isFinite(id));
      const { data: reportedComments } = commentIds.length
        ? await db().from("ua_forum_comments").select("id,topic_id,body").in("id", commentIds)
        : { data: [] };
      const commentsById = new Map<number, { topicId: number; body: string }>(
        (reportedComments ?? []).map((comment) => [
          Number(comment.id),
          { topicId: Number(comment.topic_id), body: String(comment.body ?? "") },
        ]),
      );
      const moderationReports = (reports ?? []).map((report) => {
        const comment = report.comment_id ? commentsById.get(Number(report.comment_id)) : null;
        return camel({
          ...report,
          topic_id: report.topic_id ?? comment?.topicId ?? null,
          reported_body: comment?.body ?? null,
        });
      });
      return {
        stats: {
          members,
          guides: guideCount,
          facilitators: facilitatorCount,
          conversations: topicCount + commentCount,
          reports: reportCount,
        },
        guides: camel(guides ?? []),
        facilitators: camel(facilitators ?? []),
        topics,
        reports: moderationReports,
      };
    }
    case "community.admin.topicDetail":
      await requireAdmin();
      return getTopicDetail(Number(input.topicId), true);
    case "community.admin.taxonomy": {
      await requireAdmin();
      return {
        recipeCategories: await listTaxonomy("recipe", true),
        academyModules: await listTaxonomy("module", true),
      };
    }
    case "community.admin.saveTaxonomy": {
      await requireAdmin();
      const table = input.kind === "recipe" ? "ua_recipe_categories" : "ua_academy_modules";
      const name = String(input.name ?? "").trim();
      if (name.length < 2) fail("Informe um nome válido.");
      const allowedStatuses =
        input.kind === "module"
          ? ["draft", "published", "coming_soon", "archived"]
          : ["draft", "published", "archived"];
      const values: Record<string, unknown> = {
        name,
        slug: slugifyPt(input.slug || name),
        description: input.description ?? null,
        cover_image_key: input.coverImageKey ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        status: allowedStatuses.includes(input.status) ? input.status : "draft",
        position: Number(input.position ?? 0),
        updated_at: new Date().toISOString(),
      };
      if (input.kind === "module")
        values.coming_soon_message =
          String(input.comingSoonMessage ?? "").trim() ||
          "Estamos preparando este módulo com cuidado. Em breve, novos conteúdos estarão disponíveis para você.";
      const { error } = input.id
        ? await db().from(table).update(values).eq("id", Number(input.id))
        : await db().from(table).insert(values);
      if (error) fail(error.message);
      return { success: true };
    }
    case "community.admin.deleteTaxonomy": {
      await requireAdmin();
      const table = input.kind === "recipe" ? "ua_recipe_categories" : "ua_academy_modules";
      const linkedTable = input.kind === "recipe" ? "ua_test_guides" : "ua_guides";
      const linkedColumn = input.kind === "recipe" ? "category_id" : "module_id";
      const linked = await countRows(linkedTable, { [linkedColumn]: String(Number(input.id)) });
      if (linked > 0)
        fail(`Não é possível excluir: existem ${linked} conteúdos vinculados. Arquive este item.`);
      const { error } = await db().from(table).delete().eq("id", Number(input.id));
      if (error) fail(error.message);
      return { success: true };
    }
    case "community.admin.saveGuide": {
      const user = await requireAdmin();
      const contentType = input.contentType === "video" ? "video" : "pdf";
      const moduleId = input.moduleId ? Number(input.moduleId) : null;
      if (input.status === "published" && !moduleId)
        fail("Selecione um módulo antes de publicar este conteúdo.");
      const values = {
        title: input.title,
        summary: input.summary,
        content: input.content ?? null,
        category: input.category,
        module_id: moduleId,
        content_type: contentType,
        video_url: contentType === "video" ? (input.videoUrl ?? null) : null,
        pdf_key: contentType === "pdf" ? (input.pdfKey ?? null) : null,
        pdf_url: contentType === "pdf" ? (input.pdfUrl ?? null) : null,
        estimated_duration: input.estimatedDuration ?? null,
        technical_review: input.technicalReview ?? null,
        cover_image_key: input.coverImageKey ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        status: input.status,
        position: input.position,
        published_at: input.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_guides").update(values).eq("id", input.id);
      else
        await db()
          .from("ua_guides")
          .insert({ ...values, created_by: user.id });
      return { success: true };
    }

    case "community.admin.testGuides": {
      await requireAdmin();
      const { data } = await db()
        .from("ua_test_guides")
        .select("*")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });
      return camel(data ?? []);
    }
    case "community.admin.saveTestGuide": {
      const user = await requireAdmin();
      const categoryId = input.categoryId ? Number(input.categoryId) : null;
      if (input.status === "published" && !categoryId)
        fail("Selecione uma categoria antes de publicar esta receita.");
      const values = {
        title: input.title,
        summary: input.summary,
        content: input.content ?? null,
        category: input.category,
        category_id: categoryId,
        callout: input.callout ?? null,
        accent_color: input.accentColor ?? "#0b2b26",
        cover_image_key: input.coverImageKey ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        pdf_key: input.pdfKey ?? null,
        pdf_url: input.pdfUrl ?? null,
        status: input.status,
        position: Number(input.position ?? 0),
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_test_guides").update(values).eq("id", Number(input.id));
      else
        await db()
          .from("ua_test_guides")
          .insert({ ...values, created_by: user.id });
      return { success: true };
    }
    case "community.admin.setContentStatus": {
      await requireAdmin();
      const table = input.kind === "recipe" ? "ua_test_guides" : "ua_guides";
      const status = ["draft", "published", "archived"].includes(input.status)
        ? input.status
        : fail("Situação inválida.");
      const values: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === "published") {
        const linkedColumn = table === "ua_test_guides" ? "category_id" : "module_id";
        const { data: content } = await db()
          .from(table)
          .select(linkedColumn)
          .eq("id", Number(input.id))
          .maybeSingle();
        if (!content?.[linkedColumn])
          fail(
            table === "ua_test_guides"
              ? "Selecione uma categoria antes de publicar esta receita."
              : "Selecione um módulo antes de publicar este conteúdo.",
          );
      }
      if (table === "ua_guides")
        values.published_at = status === "published" ? new Date().toISOString() : null;
      const { error } = await db().from(table).update(values).eq("id", Number(input.id));
      if (error) fail(error.message);
      return { success: true };
    }
    case "community.admin.updateContentCover": {
      await requireAdmin();
      const table = input.kind === "recipe" ? "ua_test_guides" : "ua_guides";
      const { error } = await db()
        .from(table)
        .update({
          cover_image_key: input.coverImageKey ?? null,
          cover_image_url: input.coverImageUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", Number(input.id));
      if (error) fail(error.message);
      return { success: true };
    }
    case "community.admin.deleteContent": {
      await requireAdmin();
      const table = input.kind === "recipe" ? "ua_test_guides" : "ua_guides";
      const { error } = await db().from(table).delete().eq("id", Number(input.id));
      if (error) fail(error.message);
      return { success: true };
    }
    case "community.admin.saveFacilitator": {
      const user = await requireAdmin();
      const values = {
        title: input.title,
        summary: input.summary,
        category: input.category,
        source_label: input.sourceLabel ?? null,
        link_url: input.linkUrl ?? null,
        image_key: input.imageKey ?? null,
        image_url: input.imageUrl ?? null,
        status: input.status,
        position: input.position,
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_facilitators").update(values).eq("id", input.id);
      else
        await db()
          .from("ua_facilitators")
          .insert({ ...values, created_by: user.id });
      return { success: true };
    }
    case "community.admin.moderateTopic": {
      await requireAdmin();
      await db()
        .from("ua_forum_topics")
        .update({ status: input.status })
        .eq("id", Number(input.topicId));
      return { success: true };
    }
    case "community.admin.moderateComment": {
      await requireAdmin();
      await db()
        .from("ua_forum_comments")
        .update({ status: input.status })
        .eq("id", Number(input.commentId));
      return { success: true };
    }
    case "community.admin.reviewReport": {
      const user = await requireAdmin();
      const reportId = Number(input.reportId);
      const status = ["reviewed", "dismissed", "actioned"].includes(String(input.status))
        ? String(input.status)
        : "reviewed";
      await db()
        .from("ua_forum_reports")
        .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", reportId);
      await db()
        .from("ua_audit_events")
        .insert({
          actor_user_id: user.id,
          action: "community.report.reviewed",
          entity_type: "forum_report",
          entity_id: String(reportId),
          outcome: "success",
          metadata: { status },
        });
      return { success: true };
    }

    /* --------------------------------- master -------------------------------- */
    case "community.master.dashboard": {
      await requireMaster();
      const [
        { data: userRows },
        { data: profiles },
        { data: productRows },
        { data: clicks },
        { data: campaignRows },
        { data: conversionRows },
        landingSettings,
      ] = await Promise.all([
        db().from("ua_users").select("*").order("created_at", { ascending: false }),
        db().from("ua_profiles").select("user_id,display_name"),
        db().from("ua_products").select("*").order("position", { ascending: true }),
        db().from("ua_product_clicks").select("product_id,campaign_id,origin"),
        db().from("ua_campaigns").select("*").order("created_at", { ascending: false }),
        db().from("ua_conversions").select("campaign_id,amount_cents,status"),
        getLandingSettings(),
      ]);
      const displayNames = new Map(
        (profiles ?? []).map((profile: any) => [profile.user_id, profile.display_name]),
      );
      const users = (userRows ?? []).map((row: any) => ({
        ...camel(row),
        displayName: displayNames.get(row.id) ?? null,
      }));
      const clickList = clicks ?? [];
      const products = (productRows ?? []).map((product: any) => ({
        ...camel(product),
        clicks: clickList.filter((click: any) => click.product_id === product.id).length,
      }));
      const productTitles = new Map((productRows ?? []).map((p: any) => [p.id, p.title]));
      const confirmed = (conversionRows ?? []).filter((row: any) => row.status === "confirmed");
      const campaigns = (campaignRows ?? []).map((campaign: any) => {
        const campaignConversions = confirmed.filter((row: any) => row.campaign_id === campaign.id);
        return {
          ...camel(campaign),
          productTitle: productTitles.get(campaign.product_id) ?? null,
          clicks: clickList.filter((click: any) => click.campaign_id === campaign.id).length,
          conversions: campaignConversions.length,
          revenueCents: campaignConversions.reduce(
            (total: number, row: any) => total + Number(row.amount_cents ?? 0),
            0,
          ),
        };
      });
      return {
        stats: {
          accounts: users.length,
          activeAccounts: users.filter((user: any) => user.accountStatus === "active").length,
          publishedProducts: products.filter((product: any) => product.status === "published")
            .length,
          clicks: clickList.length,
          confirmedConversions: confirmed.length,
          confirmedRevenueCents: confirmed.reduce(
            (total: number, row: any) => total + Number(row.amount_cents ?? 0),
            0,
          ),
          publicClicks: clickList.filter((click: any) => click.origin === "public").length,
          clientClicks: clickList.filter((click: any) => click.origin === "client").length,
        },
        users,
        products,
        campaigns,
        landingSettings,
      };
    }
    case "community.master.visualAssets": {
      await requireMaster();
      return listVisualAssets(false);
    }
    case "community.master.saveVisualAsset": {
      const masterUser = await requireMaster();
      if (!isVisualAssetSlot(input.slot)) fail("Slot visual inválido.");

      const slot = input.slot;
      const values = {
        slot,
        name: requiredVisualText(input.name, "Nome", 120),
        internal_title: requiredVisualText(input.internalTitle, "Título interno", 160),
        desktop_key: optionalVisualText(input.desktopImageKey, 500),
        desktop_url: visualImageUrl(input.desktopImageUrl, true),
        tablet_key: optionalVisualText(input.tabletImageKey, 500),
        tablet_url: visualImageUrl(input.tabletImageUrl, false),
        mobile_key: optionalVisualText(input.mobileImageKey, 500),
        mobile_url: visualImageUrl(input.mobileImageUrl, false),
        alt_text: requiredVisualText(input.altText, "Texto alternativo", 240),
        is_active: input.isActive !== false,
        updated_by: masterUser.authId,
        updated_at: new Date().toISOString(),
      };
      const existing = await db().from("ua_banners").select("slot").eq("slot", slot).maybeSingle();
      if (bannerTableMissing(existing.error) || bannerSchemaOutdated(existing.error))
        fail("A configuração visual ainda não está disponível no banco de dados.");
      if (existing.error) fail("Não foi possível verificar este slot visual.");

      const saved = existing.data
        ? await db().from("ua_banners").update(values).eq("slot", slot).select("slot").single()
        : await db()
            .from("ua_banners")
            .insert({ ...values, created_by: masterUser.authId })
            .select("slot")
            .single();

      if (saved.error) {
        await auditEvent(masterUser, "visual_asset.save", "visual_asset", slot, "failure", {
          slot,
          reason: "database_write_failed",
        });
        fail("Não foi possível salvar a configuração visual.");
      }

      await auditEvent(masterUser, "visual_asset.save", "visual_asset", slot, "success", {
        slot,
        isActive: values.is_active,
        operation: existing.data ? "update" : "create",
      });
      return { success: true, id: saved.data.slot };
    }
    case "community.master.drive.defaults": {
      await requireMaster();
      const { driveImportDefaults } = await import("./drive-import.server");
      const defaults = driveImportDefaults();
      return {
        rootFolderUrl: `https://drive.google.com/drive/folders/${defaults.rootFolderId}`,
        coversFolderUrl: `https://drive.google.com/drive/folders/${defaults.coversFolderId}`,
        extraFolderUrls: defaults.extraFolderIds.map(
          (id) => `https://drive.google.com/drive/folders/${id}`,
        ),
      };
    }
    case "community.master.drive.preview": {
      const masterUser = await requireMaster();
      try {
        const [{ scanAcademyDrive }, { reconcileDriveCandidates, NEW_GUIDE_EDITORIAL_COMPARISON }] =
          await Promise.all([import("./drive-import.server"), import("./drive-import")]);
        const scan = await scanAcademyDrive({
          rootFolderId: input.rootFolder,
          coversFolderId: input.coversFolder,
          extraFolderIds: Array.isArray(input.extraFolders) ? input.extraFolders : undefined,
        });
        const [moduleResult, guideResult, assetResult] = await Promise.all([
          db()
            .from("ua_academy_modules")
            .select("id,name,slug,position,status,drive_folder_id,cover_image_key"),
          db()
            .from("ua_guides")
            .select("id,title,module_id,position,status,drive_folder_id,pdf_key,cover_image_key"),
          db()
            .from("ua_drive_assets")
            .select("drive_file_id,drive_modified_at,drive_version,module_id,guide_id"),
        ]);
        for (const result of [moduleResult, guideResult, assetResult])
          if (result.error) fail(result.error.message);
        const modules = camel<any[]>(moduleResult.data ?? []);
        const guides = camel<any[]>(guideResult.data ?? []);
        const assets = camel<any[]>(assetResult.data ?? []);
        const candidates = reconcileDriveCandidates(scan.candidates, modules, guides, assets);
        const matchedGuideIds = new Set(
          candidates
            .filter((candidate) => candidate.targetKind === "academy_guide")
            .map((candidate) => candidate.existingTargetId)
            .filter(Boolean),
        );
        const platformOnly = guides
          .filter((guide) => !matchedGuideIds.has(guide.id))
          .map((guide) => ({
            id: guide.id,
            title: guide.title,
            status: guide.status,
            moduleId: guide.moduleId,
            issue: "Conteúdo cadastrado sem correspondência confirmada no acervo atual do Drive",
          }));
        const publishedWithoutModule = guides
          .filter((guide) => guide.status === "published" && !guide.moduleId)
          .map((guide) => ({ id: guide.id, title: guide.title }));
        const summary = {
          candidates: candidates.length,
          moduleCovers: candidates.filter((row) => row.targetKind === "module_cover").length,
          academyGuides: candidates.filter((row) => row.targetKind === "academy_guide").length,
          ready: candidates.filter((row) => row.classifications.includes("ready")).length,
          conflicts: candidates.filter((row) =>
            row.classifications.some((value) =>
              ["editorial_conflict", "duplicate", "registered_incorrectly"].includes(value),
            ),
          ).length,
          ignored: scan.ignored.length,
          platformOnly: platformOnly.length,
          publishedWithoutModule: publishedWithoutModule.length,
        };
        const batchInsert = await db()
          .from("ua_drive_import_batches")
          .insert({
            root_folder_id: scan.rootFolderId,
            covers_folder_id: scan.coversFolderId,
            extra_folder_ids: scan.extraFolderIds,
            status: "preview",
            requested_by: masterUser.id,
            summary,
          })
          .select("id")
          .single();
        if (batchInsert.error || !batchInsert.data)
          fail(batchInsert.error?.message || "Falha ao registrar a prévia.");
        const batchId = Number(batchInsert.data.id);
        const rows = candidates.map((candidate) => ({
          batch_id: batchId,
          target_kind: candidate.targetKind,
          drive_folder_id: candidate.driveFolderId,
          drive_file_id: candidate.driveFileId,
          cover_drive_file_id: candidate.cover?.id ?? null,
          video_drive_file_id: candidate.video?.id ?? null,
          source_path: candidate.currentFolder,
          title: candidate.title,
          position: candidate.position,
          suggested_module_id: candidate.suggestedModuleId,
          existing_target_id: candidate.existingTargetId,
          classification: candidate.classifications.join(","),
          decision: "pending",
          import_status: candidate.classifications.some((value) =>
            ["editorial_conflict", "duplicate", "registered_incorrectly"].includes(value),
          )
            ? "conflict"
            : "discovered",
          metadata: candidate,
        }));
        const itemInsert = await db()
          .from("ua_drive_import_items")
          .insert(rows)
          .select("id,drive_file_id,target_kind");
        if (itemInsert.error) fail(itemInsert.error.message);
        const ids = new Map(
          (itemInsert.data ?? []).map((row: any) => [
            `${row.target_kind}:${row.drive_file_id}`,
            Number(row.id),
          ]),
        );
        await auditEvent(
          masterUser,
          "drive.preview",
          "drive_import_batch",
          batchId,
          "success",
          summary,
        );
        return {
          batchId,
          summary,
          candidates: candidates.map((candidate) => ({
            ...candidate,
            itemId: ids.get(candidate.key),
          })),
          ignored: scan.ignored,
          warnings: scan.warnings,
          diagnostics: { platformOnly, publishedWithoutModule },
          editorialComparison: NEW_GUIDE_EDITORIAL_COMPARISON,
        };
      } catch (error) {
        await auditEvent(masterUser, "drive.preview", "drive_import_batch", null, "failure", {
          error: error instanceof Error ? error.message : "Falha desconhecida",
        });
        throw error;
      }
    }
    case "community.master.drive.importItems": {
      const masterUser = await requireMaster();
      const batchId = Number(input.batchId);
      const selections = (Array.isArray(input.items) ? input.items : []) as DriveImportSelection[];
      if (!batchId || selections.length < 1 || selections.length > 5)
        fail("Importe entre 1 e 5 itens por etapa.");
      const batch = await db()
        .from("ua_drive_import_batches")
        .select("id,status,requested_by")
        .eq("id", batchId)
        .maybeSingle();
      if (batch.error || !batch.data) fail("O lote de importação não foi encontrado.");
      if (!["preview", "importing", "partial"].includes(batch.data.status))
        fail("Este lote não aceita novas importações.");
      const ids = selections.map((item) => Number(item.itemId));
      const itemQuery = await db()
        .from("ua_drive_import_items")
        .select("*")
        .eq("batch_id", batchId)
        .in("id", ids);
      if (itemQuery.error) fail(itemQuery.error.message);
      if ((itemQuery.data ?? []).length !== ids.length)
        fail("Um ou mais itens não pertencem ao lote.");
      await db()
        .from("ua_drive_import_batches")
        .update({ status: "importing", error_message: null })
        .eq("id", batchId);
      const { GoogleDriveReadClient } = await import("./drive-import.server");
      const client = new GoogleDriveReadClient();
      const results: Array<{ itemId: number; success: boolean; message?: string }> = [];
      for (const row of itemQuery.data ?? []) {
        const selection = selections.find((item) => Number(item.itemId) === Number(row.id));
        if (!selection) continue;
        await db()
          .from("ua_drive_import_items")
          .update({ decision: "selected", import_status: "importing", error_message: null })
          .eq("id", row.id);
        try {
          const imported = await importDriveItem(
            masterUser,
            batchId,
            row as DriveImportRow,
            selection,
            client,
          );
          const metadata = { ...(row.metadata ?? {}), importResult: imported.importResult };
          const saved = await db()
            .from("ua_drive_import_items")
            .update({
              suggested_module_id: Number(selection.moduleId ?? row.suggested_module_id),
              title: String(selection.title || row.title).trim(),
              position: Math.max(0, Number(selection.position ?? row.position)),
              existing_target_id: imported.importResult.targetId,
              prior_snapshot: imported.priorSnapshot,
              metadata,
              import_status: "imported",
              error_message: null,
            })
            .eq("id", row.id);
          if (saved.error) fail(saved.error.message);
          await auditEvent(
            masterUser,
            "drive.item.import",
            row.target_kind,
            imported.importResult.targetId,
            "success",
            { batchId, itemId: row.id, driveFileId: row.drive_file_id },
          );
          results.push({ itemId: Number(row.id), success: true });
        } catch (error) {
          let message = error instanceof Error ? error.message : "Falha desconhecida";
          try {
            await compensateFailedDriveImport(Number(row.id));
          } catch (cleanupError) {
            const cleanupMessage =
              cleanupError instanceof Error ? cleanupError.message : "falha desconhecida";
            message += ` A limpeza automática também falhou: ${cleanupMessage}`;
          }
          await db()
            .from("ua_drive_import_items")
            .update({ import_status: "failed", error_message: message })
            .eq("id", row.id);
          await auditEvent(masterUser, "drive.item.import", row.target_kind, row.id, "failure", {
            batchId,
            driveFileId: row.drive_file_id,
            error: message,
          });
          results.push({ itemId: Number(row.id), success: false, message });
        }
      }
      let batchStatus = "importing";
      if (input.finalize) {
        await db()
          .from("ua_drive_import_items")
          .update({ decision: "ignored" })
          .eq("batch_id", batchId)
          .eq("decision", "pending");
        const statuses = await db()
          .from("ua_drive_import_items")
          .select("import_status")
          .eq("batch_id", batchId)
          .eq("decision", "selected");
        const failed = (statuses.data ?? []).some(
          (row: { import_status?: string }) => row.import_status === "failed",
        );
        batchStatus = failed ? "partial" : "completed";
        await db()
          .from("ua_drive_import_batches")
          .update({
            status: batchStatus,
            completed_at: new Date().toISOString(),
            error_message: failed ? "Um ou mais itens não puderam ser importados." : null,
          })
          .eq("id", batchId);
        await auditEvent(
          masterUser,
          "drive.batch.import",
          "drive_import_batch",
          batchId,
          failed ? "failure" : "success",
          { status: batchStatus },
        );
      }
      return { batchId, status: batchStatus, results };
    }
    case "community.master.drive.history": {
      await requireMaster();
      const batches = await db()
        .from("ua_drive_import_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (batches.error) fail(batches.error.message);
      let items: unknown[] = [];
      if (input.batchId) {
        const result = await db()
          .from("ua_drive_import_items")
          .select(
            "id,batch_id,target_kind,title,classification,decision,import_status,error_message,source_path,updated_at",
          )
          .eq("batch_id", Number(input.batchId))
          .order("position", { ascending: true });
        if (result.error) fail(result.error.message);
        items = result.data ?? [];
      }
      return { batches: camel(batches.data ?? []), items: camel(items) };
    }
    case "community.master.drive.rollback": {
      const masterUser = await requireMaster();
      const batchId = Number(input.batchId);
      const batch = await db()
        .from("ua_drive_import_batches")
        .select("id,status")
        .eq("id", batchId)
        .maybeSingle();
      if (batch.error || !batch.data) fail("O lote não foi encontrado.");
      if (!["completed", "partial"].includes(batch.data.status))
        fail("Somente lotes concluídos ou parciais podem ser desfeitos.");
      const importedItems = await db()
        .from("ua_drive_import_items")
        .select("*")
        .eq("batch_id", batchId)
        .eq("import_status", "imported")
        .order("id", { ascending: false });
      if (importedItems.error) fail(importedItems.error.message);
      const results: Array<{ itemId: number; success: boolean; message?: string }> = [];
      for (const row of importedItems.data ?? []) {
        try {
          const importResult = (
            row.metadata as { importResult?: DriveImportResult } | null | undefined
          )?.importResult;
          if (!importResult?.targetId || !importResult?.targetUpdatedAt)
            fail("O item não possui informações suficientes para rollback.");
          const table =
            importResult.targetKind === "module_cover" ? "ua_academy_modules" : "ua_guides";
          const current = await db()
            .from(table)
            .select("id,status,updated_at")
            .eq("id", Number(importResult.targetId))
            .maybeSingle();
          if (current.error || !current.data) fail("O registro importado não existe mais.");
          const rollbackDecision = driveRollbackDecision(
            { status: current.data.status, updatedAt: current.data.updated_at },
            {
              targetKind: importResult.targetKind,
              targetUpdatedAt: importResult.targetUpdatedAt,
              created: importResult.created,
            },
          );
          if (rollbackDecision.reason === "edited_after_import")
            fail(
              "O registro foi editado depois da importação; o rollback automático foi bloqueado.",
            );
          if (rollbackDecision.reason === "no_longer_draft")
            fail("O conteúdo deixou de ser rascunho; o rollback automático foi bloqueado.");
          if (importResult.targetKind === "academy_guide" && importResult.created) {
            const removed = await db().from("ua_guides").delete().eq("id", importResult.targetId);
            if (removed.error) fail(removed.error.message);
          } else {
            const snapshot = {
              ...(row.prior_snapshot ?? {}),
              updated_at: new Date().toISOString(),
            };
            const restored = await db()
              .from(table)
              .update(snapshot)
              .eq("id", importResult.targetId);
            if (restored.error) fail(restored.error.message);
          }
          const storage = Array.isArray(importResult.storage) ? importResult.storage : [];
          await removeImportedStorage(storage);
          await db()
            .from("ua_drive_assets")
            .update({ import_status: "rolled_back" })
            .eq("import_item_id", row.id);
          await db()
            .from("ua_drive_import_items")
            .update({ import_status: "rolled_back" })
            .eq("id", row.id);
          results.push({ itemId: Number(row.id), success: true });
        } catch (error) {
          results.push({
            itemId: Number(row.id),
            success: false,
            message: error instanceof Error ? error.message : "Falha desconhecida",
          });
        }
      }
      const failed = results.some((item) => !item.success);
      await db()
        .from("ua_drive_import_batches")
        .update({
          status: failed ? "partial" : "rolled_back",
          error_message: failed
            ? "Alguns itens foram alterados e não puderam ser desfeitos."
            : null,
        })
        .eq("id", batchId);
      await auditEvent(
        masterUser,
        "drive.batch.rollback",
        "drive_import_batch",
        batchId,
        failed ? "failure" : "success",
        { failed: results.filter((item) => !item.success).length },
      );
      return { batchId, status: failed ? "partial" : "rolled_back", results };
    }
    case "community.master.updateUserAccess": {
      const master = await requireMaster();
      if (!isAccessRole(input.accessRole)) fail("Papel de acesso inválido.");
      if (
        Number(input.userId) === master.id &&
        (input.accessRole !== "admin_master" || input.accountStatus !== "active")
      )
        fail("Você não pode suspender ou remover o próprio acesso Master.");
      const legacy = legacyValuesForAccessRole(input.accessRole);
      await db()
        .from("ua_users")
        .update({
          access_role: input.accessRole,
          role: legacy.role,
          account_status: input.accountStatus,
          membership_status: legacy.membershipStatus,
        })
        .eq("id", Number(input.userId));
      await db()
        .from("ua_audit_events")
        .insert({
          actor_auth_id: master.authId,
          actor_user_id: master.id,
          action: "user.access_role.update",
          entity_type: "ua_user",
          entity_id: String(input.userId),
          outcome: "success",
          metadata: { accessRole: input.accessRole, accountStatus: input.accountStatus },
        });
      return { success: true };
    }
    case "community.master.saveProduct": {
      const master = await requireMaster();
      const values = {
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        category: input.category,
        external_url: input.externalUrl,
        cover_image_key: input.coverImageKey ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        status: input.status,
        featured_on_home: input.featuredOnHome,
        position: input.position,
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_products").update(values).eq("id", input.id);
      else
        await db()
          .from("ua_products")
          .insert({ ...values, created_by: master.id });
      return { success: true };
    }
    case "community.master.saveCampaign": {
      const master = await requireMaster();
      const values = {
        name: input.name,
        slug: input.slug,
        product_id: input.productId,
        status: input.status,
        utm_source: input.utmSource ?? null,
        utm_medium: input.utmMedium ?? null,
        utm_campaign: input.utmCampaign ?? null,
        utm_content: input.utmContent ?? null,
        landing_url: input.landingUrl ?? null,
        notes: input.notes ?? null,
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_campaigns").update(values).eq("id", input.id);
      else
        await db()
          .from("ua_campaigns")
          .insert({ ...values, created_by: master.id });
      return { success: true };
    }
    case "community.master.saveLandingSettings": {
      const master = await requireMaster();
      const { data: current } = await db()
        .from("ua_landing_settings")
        .select("id")
        .limit(1)
        .maybeSingle();
      const values = {
        show_product_shelf: input.showProductShelf,
        product_shelf_title: input.productShelfTitle,
        product_shelf_description: input.productShelfDescription,
        updated_by: master.id,
        updated_at: new Date().toISOString(),
      };
      if (current) await db().from("ua_landing_settings").update(values).eq("id", current.id);
      else await db().from("ua_landing_settings").insert(values);
      return { success: true };
    }
    case "community.master.registerConversion": {
      const master = await requireMaster();
      if (input.campaignId) {
        const { data: campaign } = await db()
          .from("ua_campaigns")
          .select("product_id")
          .eq("id", input.campaignId)
          .maybeSingle();
        if (!campaign || campaign.product_id !== input.productId)
          fail("A campanha selecionada não pertence a este produto.");
      }
      await db()
        .from("ua_conversions")
        .insert({
          product_id: input.productId,
          campaign_id: input.campaignId ?? null,
          amount_cents: input.amountCents ?? null,
          currency: input.currency,
          note: input.note ?? null,
          occurred_at: new Date(input.occurredAt).toISOString(),
          created_by: master.id,
          source: "manual",
          status: "confirmed",
        });
      return { success: true };
    }
    case "community.master.accessControl": {
      await requireMaster();
      const [{ data: levels }, { data: assignments }] = await Promise.all([
        db().from("ua_access_levels").select("*").order("name", { ascending: true }),
        db().from("ua_user_access_levels").select("user_id,access_level_id"),
      ]);
      return {
        levels: (levels ?? []).map((level: any) => ({
          ...camel(level),
          permissions: JSON.parse(level.permissions ?? "[]"),
        })),
        assignments: camel(assignments ?? []),
      };
    }
    case "community.master.saveAccessLevel": {
      const master = await requireMaster();
      const values = {
        name: String(input.name).trim(),
        slug: String(input.slug).trim().toLowerCase(),
        description: input.description?.trim() || null,
        permissions: JSON.stringify(input.permissions ?? []),
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_access_levels").update(values).eq("id", input.id);
      else
        await db()
          .from("ua_access_levels")
          .insert({ ...values, created_by: master.id });
      return { success: true };
    }
    case "community.master.deleteAccessLevel": {
      await requireMaster();
      await db().from("ua_access_levels").delete().eq("id", Number(input.id));
      return { success: true };
    }
    case "community.master.assignAccessLevel": {
      const master = await requireMaster();
      if (Number(input.userId) === master.id && !input.assigned)
        fail("Você não pode remover seus próprios níveis de acesso.");
      if (input.assigned)
        await db()
          .from("ua_user_access_levels")
          .upsert(
            { user_id: Number(input.userId), access_level_id: Number(input.accessLevelId) },
            { onConflict: "user_id,access_level_id" },
          );
      else
        await db()
          .from("ua_user_access_levels")
          .delete()
          .eq("user_id", Number(input.userId))
          .eq("access_level_id", Number(input.accessLevelId));
      return { success: true };
    }
    case "community.master.saveTestGuide": {
      const master = await requireMaster();
      const values = {
        title: input.title,
        summary: input.summary,
        content: input.content ?? null,
        category: input.category,
        callout: input.callout ?? null,
        accent_color: input.accentColor ?? "#0b2b26",
        cover_image_key: input.coverImageKey ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        pdf_key: input.pdfKey ?? null,
        pdf_url: input.pdfUrl ?? null,
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_test_guides").update(values).eq("id", input.id);
      else
        await db()
          .from("ua_test_guides")
          .insert({ ...values, created_by: master.id });
      return { success: true };
    }
    case "community.master.updateTestGuideCover": {
      await requireMaster();
      await db()
        .from("ua_test_guides")
        .update({ cover_image_key: input.coverImageKey, cover_image_url: input.coverImageUrl })
        .eq("id", Number(input.guideId));
      return { success: true, guideId: Number(input.guideId) };
    }

    default:
      fail(`Recurso indisponível: ${path}`);
  }
}
