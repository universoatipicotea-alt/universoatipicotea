/* eslint-disable @typescript-eslint/no-explicit-any -- consultas Supabase usam o cliente administrativo legado sem Database gerado */
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  storeCollectionSchema,
  storeDetailsSchema,
  storeProductSchema,
  storeSettingsSchema,
} from "@shared/store";

const db = () => supabaseAdmin as any;
// Explicit projection: never expose uploader keys, authors or administrative metadata.
const columns =
  "id,title,slug,summary,category,category_id,collection_ids,image_url,link_url,source_label,price_cents,sale_price_cents,shop_details,position,created_at";
const collectionColumns = "id,name,slug,kind,description,image_url,position,status,featured";
function checked(result: any) {
  if (result.error)
    throw new Error(
      "Não foi possível acessar a loja. Verifique a configuração ou tente novamente.",
    );
  return result.data;
}
function product(row: any) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    category: row.category,
    categoryId: row.category_id,
    collectionIds: row.collection_ids ?? [],
    imageUrl: row.image_url ?? "",
    linkUrl: row.link_url ?? "",
    sourceLabel: row.source_label ?? "Comprar no parceiro",
    priceCents: row.price_cents,
    salePriceCents: row.sale_price_cents,
    shopDetails: storeDetailsSchema.parse(row.shop_details ?? {}),
    position: row.position,
    createdAt: row.created_at,
    ...(row.status
      ? {
          status: row.status,
          visiblePublic: row.visible_public,
          visibleMembers: row.visible_members,
          imageKey: row.image_key,
        }
      : {}),
  };
}
function collection(row: any) {
  const { image_url, ...rest } = row;
  return { ...rest, imageUrl: image_url };
}
function visible(members: boolean) {
  return db()
    .from("ua_facilitators")
    .select(columns)
    .eq("status", "published")
    .eq(members ? "visible_members" : "visible_public", true);
}
const querySchema = z.object({
  members: z.boolean().default(false),
  search: z.string().trim().max(120).default(""),
  collection: z.string().max(200).default(""),
  category: z.number().int().positive().nullable().default(null),
  sort: z.enum(["recommended", "newest", "price-low", "price-high"]).default("recommended"),
  page: z.number().int().min(1).max(10000).default(1),
});
async function taxonomy() {
  return (
    checked(
      await db()
        .from("ua_store_collections")
        .select(collectionColumns)
        .eq("status", "published")
        .order("position")
        .order("id"),
    ) ?? []
  ).map(collection);
}
export async function storeCatalog(raw: unknown) {
  const input = querySchema.parse(raw);
  const collections = await taxonomy();
  let q = visible(input.members);
  if (input.search) q = q.ilike("title", `%${input.search.replace(/[%_\\]/g, "")}%`);
  if (input.category) q = q.eq("category_id", input.category);
  if (input.collection) {
    const c = collections.find((c: any) => c.slug === input.collection);
    if (!c) return { products: [], hasMore: false, collections, missingCollection: true };
    q = c.kind === "category" ? q.eq("category_id", c.id) : q.contains("collection_ids", [c.id]);
  }
  if (input.sort === "newest") q = q.order("created_at", { ascending: false });
  else if (input.sort.startsWith("price"))
    q = q.order("store_price_cents", { ascending: input.sort === "price-low", nullsFirst: false });
  else q = q.order("position");
  const rows = checked(await q.order("id").range((input.page - 1) * 24, input.page * 24));
  return {
    products: rows.slice(0, 24).map(product),
    hasMore: rows.length > 24,
    collections,
    missingCollection: false,
  };
}
export async function storeHome(members: boolean) {
  const [collections, settingsResult, ...groups] = await Promise.all([
    taxonomy(),
    db().from("ua_store_settings").select("settings").eq("id", 1).maybeSingle(),
    ...["featured", "bestseller", "isNew", "kit"].map((flag) =>
      visible(members)
        .contains("shop_details", { [flag]: true })
        .order("position")
        .order("id")
        .limit(8),
    ),
  ]);
  return {
    collections,
    settings: storeSettingsSchema.parse(checked(settingsResult)?.settings ?? {}),
    groups: Object.fromEntries(
      ["featured", "bestseller", "isNew", "kit"].map((key, i) => [
        key,
        checked(groups[i]).map(product),
      ]),
    ),
  };
}
export async function storeProduct(raw: unknown) {
  const input = z
    .object({ slug: z.string().min(1).max(200), members: z.boolean().default(false) })
    .parse(raw);
  const row = checked(await visible(input.members).eq("slug", input.slug).maybeSingle());
  if (!row) return null;
  const p = product(row);
  const details = p.shopDetails;
  let relatedQuery = visible(input.members).neq("id", p.id);
  relatedQuery = details.relatedIds.length
    ? relatedQuery.in("id", details.relatedIds)
    : relatedQuery.eq("category_id", p.categoryId ?? -1);
  const [related, complementary] = await Promise.all([
    relatedQuery.order("position").limit(8),
    details.complementaryIds.length
      ? visible(input.members)
          .in("id", details.complementaryIds)
          .neq("id", p.id)
          .order("position")
          .limit(8)
      : Promise.resolve({ data: [] }),
  ]);
  return {
    product: p,
    related: checked(related).map(product),
    complementary: checked(complementary).map(product),
  };
}
export async function storeCart(raw: unknown) {
  const input = z
    .object({
      members: z.boolean().default(false),
      ids: z.array(z.number().int().positive()).max(50),
    })
    .parse(raw);
  return input.ids.length
    ? checked(await visible(input.members).in("id", input.ids)).map(product)
    : [];
}
export async function storeAdminCatalog(raw: unknown) {
  const input = z
    .object({
      page: z.number().int().min(1).max(10000).default(1),
      search: z.string().max(120).default(""),
    })
    .parse(raw);
  const [items, collections, settings] = await Promise.all([
    db()
      .from("ua_facilitators")
      .select(`${columns},status,visible_public,visible_members,image_key`)
      .ilike("title", `%${input.search.replace(/[%_\\]/g, "")}%`)
      .order("position")
      .order("id")
      .range((input.page - 1) * 30, input.page * 30),
    db().from("ua_store_collections").select(collectionColumns).order("position").order("id"),
    db().from("ua_store_settings").select("settings").eq("id", 1).maybeSingle(),
  ]);
  const rows = checked(items);
  return {
    products: rows.slice(0, 30).map(product),
    hasMore: rows.length > 30,
    collections: checked(collections).map(collection),
    settings: storeSettingsSchema.parse(checked(settings)?.settings ?? {}),
  };
}
export async function saveStoreProduct(raw: unknown, userId: number) {
  const p = storeProductSchema.parse(raw);
  const taxonomyIds = [...new Set([...(p.categoryId ? [p.categoryId] : []), ...p.collectionIds])];
  const taxa = taxonomyIds.length
    ? checked(await db().from("ua_store_collections").select("id,name,kind").in("id", taxonomyIds))
    : [];
  if (
    taxa.length !== taxonomyIds.length ||
    (p.categoryId && !taxa.some((c: any) => c.id === p.categoryId && c.kind === "category")) ||
    p.collectionIds.some((id) => !taxa.some((c: any) => c.id === id && c.kind === "collection"))
  )
    throw new Error("Selecione categorias e coleções válidas.");
  const values = {
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    category: taxa.find((c: any) => c.id === p.categoryId)?.name ?? "Geral",
    category_id: p.categoryId,
    collection_ids: p.collectionIds,
    image_url: p.imageUrl,
    image_key: p.imageKey,
    link_url: p.linkUrl,
    source_label: p.sourceLabel,
    price_cents: p.priceCents,
    sale_price_cents: p.salePriceCents,
    visible_public: p.visiblePublic,
    visible_members: p.visibleMembers,
    status: p.status,
    position: p.position,
    shop_details: p.shopDetails,
    updated_at: new Date().toISOString(),
  };
  const result = p.id
    ? await db().from("ua_facilitators").update(values).eq("id", p.id).select("id").single()
    : await db()
        .from("ua_facilitators")
        .insert({ ...values, created_by: userId })
        .select("id")
        .single();
  if (result.error)
    throw new Error(
      result.error.code === "23505"
        ? "Este slug já está em uso. Escolha outro."
        : "Não foi possível salvar o produto.",
    );
  return result.data;
}
export async function saveStoreCollection(raw: unknown) {
  const c = storeCollectionSchema.parse(raw);
  const values = {
    name: c.name,
    slug: c.slug,
    kind: c.kind,
    description: c.description,
    image_url: c.imageUrl,
    position: c.position,
    status: c.status,
    featured: c.featured,
    updated_at: new Date().toISOString(),
  };
  if (c.id) {
    const existing = checked(
      await db().from("ua_store_collections").select("kind").eq("id", c.id).single(),
    );
    if (existing.kind !== c.kind)
      throw new Error("O tipo de uma categoria/coleção existente não pode ser alterado.");
  }
  const result = c.id
    ? await db().from("ua_store_collections").update(values).eq("id", c.id).select("id").single()
    : await db().from("ua_store_collections").insert(values).select("id").single();
  if (result.error)
    throw new Error(
      result.error.code === "23505"
        ? "Este slug já está em uso."
        : "Não foi possível salvar a coleção.",
    );
  return result.data;
}
export async function saveStoreSettings(raw: unknown) {
  checked(
    await db()
      .from("ua_store_settings")
      .upsert({
        id: 1,
        settings: storeSettingsSchema.parse(raw),
        updated_at: new Date().toISOString(),
      }),
  );
  return { success: true };
}
