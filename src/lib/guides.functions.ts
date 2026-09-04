import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import {
  LOVABLE_CLOUD_SUPABASE_PUBLISHABLE_KEY,
  LOVABLE_CLOUD_SUPABASE_URL,
} from "@/integrations/supabase/public-config";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const PUBLIC_GUIDE_COLUMNS =
  "id, title, summary, callout, category, accent_color, cover_url, page_count, collection, has_pdf, published_at, created_at";

export type PublicGuide = {
  id: string;
  title: string;
  summary: string;
  callout: string | null;
  category: string;
  accent_color: string;
  cover_url: string | null;
  page_count: number;
  collection: "biblioteca" | "academia";
  has_pdf: boolean;
  published_at: string | null;
  created_at: string;
};

const collectionSchema = z.object({
  collection: z.enum(["biblioteca", "academia"]).optional(),
});

/**
 * Catálogo público: nunca devolve pdf_path, URL de storage ou bytes do PDF.
 * As colunas sensíveis também não são acessíveis pelo papel anônimo no banco.
 */
export const listPublicGuides = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => collectionSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<PublicGuide[]> => {
    const url = process.env["SUPABASE_URL"] || LOVABLE_CLOUD_SUPABASE_URL;
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] || LOVABLE_CLOUD_SUPABASE_PUBLISHABLE_KEY;
    const supabasePublic = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    let query = supabasePublic
      .from("guides")
      .select(PUBLIC_GUIDE_COLUMNS)
      .eq("status", "published")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    if (data.collection) query = query.eq("collection", data.collection);

    const { data: rows, error } = await query;
    if (error) {
      console.error("listPublicGuides", error.message);
      return [];
    }
    return (rows ?? []) as unknown as PublicGuide[];
  });
