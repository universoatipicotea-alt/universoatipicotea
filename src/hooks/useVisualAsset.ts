import { trpc } from "@/lib/trpc";
import {
  resolveVisualAssetSources,
  type VisualAssetPublic,
  type VisualAssetSlot,
  type VisualAssetSourceInput,
} from "@/lib/visual-assets";

type UseVisualAssetOptions = {
  enabled?: boolean;
  override?: VisualAssetSourceInput | null;
};

/** Consulta pública somente-leitura; o backend devolve apenas slots ativos e URLs de imagem. */
export function useVisualAsset(
  slot: VisualAssetSlot,
  fallback?: VisualAssetSourceInput | null,
  options: UseVisualAssetOptions = {},
) {
  const query = trpc.community.visualAssets.active.useQuery(undefined, {
    enabled: options.enabled !== false && !options.override,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const configured = options.override
    ? options.override
    : ((query.data ?? []) as VisualAssetPublic[]).find((item) => item.slot === slot);

  return {
    asset: configured ?? null,
    sources: resolveVisualAssetSources(configured, fallback),
    isLoading: query.isLoading,
    isFallback: !configured,
  };
}
