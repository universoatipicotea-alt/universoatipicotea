import type { ImgHTMLAttributes } from "react";
import { useVisualAsset } from "@/hooks/useVisualAsset";
import { cn } from "@/lib/utils";
import { type VisualAssetSlot, type VisualAssetSourceInput } from "@/lib/visual-assets";

type ResponsiveVisualAssetProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "loading" | "src" | "srcSet"
> & {
  slot: VisualAssetSlot;
  fallback?: VisualAssetSourceInput | null;
  assetOverride?: VisualAssetSourceInput | null;
  defaultAlt?: string;
  eager?: boolean;
  pictureClassName?: string;
};

/**
 * Renderiza somente a variante correspondente ao viewport. Em ausência de uma
 * variante, aplica mobile → tablet → desktop sem baixar uma arte desktop oculta.
 */
export default function ResponsiveVisualAsset({
  slot,
  fallback,
  assetOverride,
  defaultAlt = "",
  eager = false,
  pictureClassName,
  className,
  ...imageProps
}: ResponsiveVisualAssetProps) {
  const { sources } = useVisualAsset(slot, fallback, {
    enabled: !assetOverride,
    override: assetOverride,
  });
  const alt = sources.altText || defaultAlt;

  if (!sources.desktop) return null;

  return (
    <picture className={cn("block max-w-full", pictureClassName)} data-visual-slot={slot}>
      <source media="(max-width: 639px)" srcSet={sources.mobile} />
      <source media="(max-width: 1023px)" srcSet={sources.tablet} />
      <img
        {...imageProps}
        src={sources.desktop}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        className={cn("block h-auto max-w-full", className)}
      />
    </picture>
  );
}
