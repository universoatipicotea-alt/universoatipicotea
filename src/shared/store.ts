import { z } from "zod";

const safeUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use uma URL HTTPS ou um caminho local.");
const externalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use um link de compra HTTPS.");
const money = z.number().int().min(0).max(100000000).nullable();
const ids = z.array(z.number().int().positive()).max(50).default([]);
export const storeDetailsSchema = z.object({
  description: z.string().max(20000).default(""),
  highlights: z.string().max(5000).default(""),
  usage: z.string().max(5000).default(""),
  specifications: z.string().max(5000).default(""),
  care: z.string().max(5000).default(""),
  gallery: z.array(safeUrl).max(12).default([]),
  supportImages: z.array(safeUrl).max(8).default([]),
  tags: z.array(z.string().trim().max(60)).max(20).default([]),
  variants: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(100),
        available: z.boolean(),
        url: externalUrl.default(""),
      }),
    )
    .max(30)
    .default([]),
  availability: z.enum(["available", "unavailable", "consult"]).default("consult"),
  badge: z.string().max(40).default(""),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  kit: z.boolean().default(false),
  relatedIds: ids,
  complementaryIds: ids,
  purchaseInfo: z
    .string()
    .max(2000)
    .default(
      "Compra realizada no site do parceiro. Confira preço, disponibilidade, frete e condições no destino.",
    ),
});
export const storeProductSchema = z
  .object({
    id: z.number().int().positive().optional(),
    title: z.string().trim().min(2).max(200),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    summary: z.string().max(500),
    categoryId: z.number().int().positive().nullable(),
    collectionIds: ids,
    imageUrl: safeUrl,
    imageKey: z.string().max(1000).nullable().default(null),
    linkUrl: externalUrl,
    sourceLabel: z.string().max(60).default("Comprar no parceiro"),
    priceCents: money,
    salePriceCents: money,
    visiblePublic: z.boolean(),
    visibleMembers: z.boolean(),
    status: z.enum(["draft", "published"]),
    position: z.number().int().min(0).max(100000),
    shopDetails: storeDetailsSchema,
  })
  .superRefine((p, ctx) => {
    if (p.salePriceCents !== null && (p.priceCents === null || p.salePriceCents >= p.priceCents))
      ctx.addIssue({
        code: "custom",
        path: ["salePriceCents"],
        message: "O preço promocional deve ser menor que o preço regular.",
      });
    if (p.status === "published" && !p.imageUrl)
      ctx.addIssue({
        code: "custom",
        path: ["imageUrl"],
        message: "Adicione uma imagem antes de publicar.",
      });
  });
export const storeCollectionSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: z.enum(["category", "collection"]),
  description: z.string().max(1000),
  imageUrl: safeUrl,
  position: z.number().int().min(0).max(100000),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
});
export const storeSettingsSchema = z.object({
  promotion: z.string().max(200).default(""),
  heroTitle: z.string().max(160).default("Escolhas para o seu cotidiano."),
  heroDescription: z
    .string()
    .max(600)
    .default("Produtos e recursos selecionados pelo Universo Atípico."),
  heroImage: safeUrl.default(""),
  heroCollectionId: z.number().int().positive().nullable().default(null),
  editorial: z
    .array(
      z.object({
        title: z.string().min(2).max(140),
        description: z.string().max(400),
        imageUrl: safeUrl,
        collectionId: z.number().int().positive().nullable(),
      }),
    )
    .max(4)
    .default([]),
});
export type StoreDetails = z.infer<typeof storeDetailsSchema>;
export type StoreProductInput = z.infer<typeof storeProductSchema>;
export type StoreCollection = z.infer<typeof storeCollectionSchema> & { id: number };
export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type StoreProduct = StoreProductInput & { id: number; category: string; createdAt: string };
export function effectivePrice(p: Pick<StoreProduct, "priceCents" | "salePriceCents">) {
  return p.salePriceCents ?? p.priceCents;
}
export function formatMoney(cents: number | null) {
  return cents === null
    ? "Consulte no parceiro"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
