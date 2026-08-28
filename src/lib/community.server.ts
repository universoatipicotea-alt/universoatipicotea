/**
 * Camada de dados do Universo Atípico.
 * Reproduz os endpoints tRPC originais sobre o banco do Lovable Cloud.
 */
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PDF_BUCKET = "guias-pdf";
const IMAGE_BUCKET = "guias-capas";

type Role = "user" | "admin" | "master";
type UaUser = {
  id: number;
  authId: string;
  name: string | null;
  email: string | null;
  role: Role;
  accountStatus: "active" | "suspended";
  membershipStatus: "member" | "free" | "canceled";
  createdAt: string | null;
  lastSignedIn: string | null;
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

async function authUserFromRequest() {
  const request = getRequest();
  const header = request?.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
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

  const { count } = await db().from("ua_users").select("id", { count: "exact", head: true });
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
      role: (count ?? 0) === 0 ? "master" : "user",
      account_status: "active",
      membership_status: "member",
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
  if (user.role !== "admin" && user.role !== "master") fail("Acesso restrito à equipe.");
  return user;
}

async function requireMaster() {
  const user = await requireUser();
  if (user.role !== "master") fail("Acesso restrito ao Master.");
  return user;
}

async function assertMemberContent(user: UaUser) {
  const privileged = user.role === "admin" || user.role === "master";
  if (privileged) return;
  if (user.membershipStatus === "member") return;
  const { data: sub } = await db()
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.authId)
    .eq("status", "active")
    .maybeSingle();
  if (sub) return;
  fail("Este conteúdo é exclusivo para membros.");
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

async function listPublishedGuides() {
  const { data } = await db()
    .from("ua_guides")
    .select("id,title,summary,content,category,pdf_key,cover_image_url,published_at,created_at")
    .eq("status", "published")
    .order("position", { ascending: true })
    .order("published_at", { ascending: false });
  return (data ?? []).map((row: any) => {
    const { pdf_key, ...rest } = row;
    return { ...camel(rest), hasPdf: Boolean(pdf_key) };
  });
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
        "Recomendações externas escolhidas pelo Universo Atípico. A comunidade continua gratuita e a decisão é sempre sua.",
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
  const privileged = user.role === "admin" || user.role === "master";
  const { data: sub } = await db()
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.authId)
    .eq("status", "active")
    .maybeSingle();
  const hasActive = Boolean(sub);
  return {
    status: hasActive ? "member" : user.membershipStatus,
    planName: "Plano Universo",
    priceCents: 4990,
    currency: "BRL" as const,
    canAccessPremium: privileged || hasActive || user.membershipStatus === "member",
    canCancel: !privileged && hasActive,
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
      authorName: nameById.get(author_id) ?? null,
      authorDisplayName: profile?.display_name ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
    };
  });
}

async function listTopics(includeHidden = false) {
  let query = db().from("ua_forum_topics").select("*");
  if (!includeHidden) query = query.eq("status", "visible");
  const { data } = await query.order("updated_at", { ascending: false }).limit(100);
  return decorateAuthors(data ?? []);
}

async function getTopicDetail(topicId: number, includeHidden = false) {
  const { data: topicRow } = await db()
    .from("ua_forum_topics")
    .select("*")
    .eq("id", topicId)
    .maybeSingle();
  if (!topicRow || (!includeHidden && topicRow.status !== "visible")) return null;
  const [topic] = await decorateAuthors([topicRow]);
  let commentQuery = db().from("ua_forum_comments").select("*").eq("topic_id", topicId);
  if (!includeHidden) commentQuery = commentQuery.eq("status", "visible");
  const { data: commentRows } = await commentQuery.order("created_at", { ascending: true });
  const comments = await decorateAuthors(commentRows ?? []);
  return { topic, comments };
}

async function ensureMemberProfile(user: UaUser) {
  const existing = await db()
    .from("ua_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
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
  if (!includeDrafts) query = query.eq("status", "published");
  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []).map((row: any) => {
    const { pdf_key, pdf_url, ...rest } = row;
    return { ...camel(rest), hasPdf: Boolean(pdf_key) };
  });
}


/* -------------------------------- uploads -------------------------------- */

function decodeDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) fail("Arquivo inválido.");
  const mimeType = match[1]!;
  const binary = atob(match[2]!);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { bytes, mimeType };
}

function safeName(fileName: string, mimeType: string) {
  const base = fileName
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
  const { bytes, mimeType } = decodeDataUrl(input.dataUrl);
  const key = `${folder}/${safeName(input.fileName, mimeType)}`;
  const { error } = await db()
    .storage.from(bucket)
    .upload(key, bytes, { contentType: mimeType, upsert: true });
  if (error) fail(error.message);
  if (bucket === IMAGE_BUCKET) {
    return { key, url: `/api/public/ua-image/${key}`, fileName: input.fileName };
  }
  return { key, url: `/api/protected-pdf/key/${encodeURIComponent(key)}`, fileName: input.fileName };
}

async function signedPdfUrl(pdfKey: string) {
  const { data, error } = await db().storage.from(PDF_BUCKET).createSignedUrl(pdfKey, 60 * 30);
  if (error || !data?.signedUrl) fail("Não foi possível abrir este PDF.");
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
      const [metrics, guides, facilitators, featuredProducts, landingSettings, topics] =
        await Promise.all([
          getCommunityMetrics(),
          listPublishedGuides(),
          listPublishedFacilitators(),
          listPublishedProducts(true),
          getLandingSettings(),
          listTopics(false),
        ]);
      return {
        metrics,
        guides: guides.slice(0, 3),
        facilitators: facilitators.slice(0, 3),
        featuredProducts: featuredProducts.slice(0, 3),
        landingSettings,
        topics: topics.slice(0, 3),
      };
    }
    case "community.funnel.get":
      return getFunnelSettings();
    case "community.funnel.update":
      return updateFunnelSettings(input);
    case "community.publicGuides":
      return listPublishedGuides();
    case "community.publicAcademiaGuides":
      return listTestGuides(false);
    case "community.forum.list":
      return listTopics(false);
    case "community.forum.detail":
      return getTopicDetail(Number(input.topicId), false);
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
      await db().from("ua_product_clicks").insert({
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
      const { profile, preferences } = await ensureMemberProfile(user);
      const [guides, facilitators, products, recentTopics, metrics] = await Promise.all([
        listPublishedGuides(),
        listPublishedFacilitators(),
        listPublishedProducts(),
        listTopics(false),
        getCommunityMetrics(),
      ]);
      return {
        profile,
        preferences,
        guides,
        facilitators,
        products,
        recentTopics: recentTopics.slice(0, 4),
        metrics,
      };
    }
    case "community.subscription.me":
      return getSubscriptionStatus(await requireUser());
    case "community.subscription.cancel": {
      const user = await requireUser();
      if (user.role === "user" && user.membershipStatus === "member") {
        await db().from("ua_users").update({ membership_status: "canceled" }).eq("id", user.id);
        return getSubscriptionStatus({ ...user, membershipStatus: "canceled" });
      }
      return getSubscriptionStatus(user);
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
    case "community.forum.createTopic": {
      const user = await requireUser();
      const { error } = await db().from("ua_forum_topics").insert({
        title: input.title,
        body: input.body,
        category: input.category,
        author_id: user.id,
      });
      if (error) fail(error.message);
      return { success: true };
    }
    case "community.forum.addComment": {
      const user = await requireUser();
      const { data: topic } = await db()
        .from("ua_forum_topics")
        .select("id,status,comment_count")
        .eq("id", Number(input.topicId))
        .maybeSingle();
      if (!topic || topic.status !== "visible")
        fail("Este tópico não está disponível para comentários.");
      const { error } = await db()
        .from("ua_forum_comments")
        .insert({ topic_id: topic.id, body: input.body, author_id: user.id });
      if (error) fail(error.message);
      await db()
        .from("ua_forum_topics")
        .update({
          comment_count: Number(topic.comment_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topic.id);
      return { success: true };
    }
    case "community.forum.downloadGuide": {
      const user = await requireUser();
      const { data: guide } = await db()
        .from("ua_guides")
        .select("id,status,pdf_key")
        .eq("id", Number(input.guideId))
        .maybeSingle();
      const privileged = user.role === "admin" || user.role === "master";
      if (!guide?.pdf_key || (guide.status !== "published" && !privileged))
        fail("Guia não encontrado.");
      return { url: `/api/protected-pdf/guide/${guide.id}` };
    }

    /* --------------------------- leitura protegida --------------------------- */
    case "community.pdfSource": {
      const user = await requireUser();
      const table = input.sourceType === "testGuide" ? "ua_test_guides" : "ua_guides";
      if (input.sourceType === "testGuide") await assertMemberContent(user);
      const { data } = await db()
        .from(table)
        .select("id,status,pdf_key")
        .eq("id", Number(input.documentId))
        .maybeSingle();
      const privileged = user.role === "admin" || user.role === "master";
      if (!data?.pdf_key || (data.status !== "published" && !privileged))
        fail("Conteúdo indisponível.");
      return { url: await signedPdfUrl(data.pdf_key) };
    }
    case "community.readingProgress.get": {
      const user = await requireUser();
      if (input.sourceType === "testGuide") await assertMemberContent(user);
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
      if (input.sourceType === "testGuide") await assertMemberContent(user);
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
        await db().from("ua_reading_progress").insert({
          user_id: user.id,
          source_type: input.sourceType,
          document_id: Number(input.documentId),
          ...values,
        });
      return { currentPage: input.currentPage, pageCount: input.pageCount };
    }
    case "community.annotations.list": {
      const user = await requireUser();
      if (input.sourceType === "testGuide") await assertMemberContent(user);
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
      if (input.sourceType === "testGuide") await assertMemberContent(user);
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

    /* --------------------------------- admin --------------------------------- */
    case "community.admin.dashboard": {
      await requireAdmin();
      const [members, guideCount, facilitatorCount, topicCount, commentCount] = await Promise.all([
        countRows("ua_users"),
        countRows("ua_guides"),
        countRows("ua_facilitators"),
        countRows("ua_forum_topics"),
        countRows("ua_forum_comments"),
      ]);
      const [{ data: guides }, { data: facilitators }, topics] = await Promise.all([
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
      ]);
      return {
        stats: {
          members,
          guides: guideCount,
          facilitators: facilitatorCount,
          conversations: topicCount + commentCount,
        },
        guides: camel(guides ?? []),
        facilitators: camel(facilitators ?? []),
        topics,
      };
    }
    case "community.admin.topicDetail":
      await requireAdmin();
      return getTopicDetail(Number(input.topicId), true);
    case "community.admin.saveGuide": {
      const user = await requireAdmin();
      const values = {
        title: input.title,
        summary: input.summary,
        content: input.content ?? null,
        category: input.category,
        pdf_key: input.pdfKey ?? null,
        pdf_url: input.pdfUrl ?? null,
        cover_image_key: input.coverImageKey ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        status: input.status,
        position: input.position,
        published_at: input.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      if (input.id) await db().from("ua_guides").update(values).eq("id", input.id);
      else await db().from("ua_guides").insert({ ...values, created_by: user.id });
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
      else await db().from("ua_facilitators").insert({ ...values, created_by: user.id });
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

    /* --------------------------------- master -------------------------------- */
    case "community.master.dashboard": {
      await requireMaster();
      const [{ data: userRows }, { data: profiles }, { data: productRows }, { data: clicks }, { data: campaignRows }, { data: conversionRows }, landingSettings] =
        await Promise.all([
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
          publishedProducts: products.filter((product: any) => product.status === "published").length,
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
    case "community.master.updateUserAccess": {
      const master = await requireMaster();
      if (
        Number(input.userId) === master.id &&
        (input.role !== "master" || input.accountStatus !== "active")
      )
        fail("Você não pode suspender ou remover o próprio acesso Master.");
      await db()
        .from("ua_users")
        .update({
          role: input.role,
          account_status: input.accountStatus,
          membership_status: input.membershipStatus ?? "member",
        })
        .eq("id", Number(input.userId));
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
      else await db().from("ua_products").insert({ ...values, created_by: master.id });
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
      else await db().from("ua_campaigns").insert({ ...values, created_by: master.id });
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
      await db().from("ua_conversions").insert({
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
      else await db().from("ua_access_levels").insert({ ...values, created_by: master.id });
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
      else await db().from("ua_test_guides").insert({ ...values, created_by: master.id });
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
