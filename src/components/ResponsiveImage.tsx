import type { CSSProperties, ImgHTMLAttributes } from "react";

export type ResponsiveImageSources = {
  desktop?: string | null;
  tablet?: string | null;
  mobile?: string | null;
};

type ResponsiveImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "loading" | "decoding"
> & {
  sources: ResponsiveImageSources;
  fallback?: string | null;
  eager?: boolean;
  pictureClassName?: string;
  pictureStyle?: CSSProperties;
};

/**
 * Entrega a arte adequada para cada viewport sem obrigar o celular a baixar o
 * arquivo de desktop. A cascata mobile -> tablet -> desktop também mantém a
 * página estável quando uma variante opcional ainda não foi cadastrada.
 */
export function ResponsiveImage({
  sources,
  fallback,
  eager = false,
  pictureClassName,
  pictureStyle,
  alt,
  ...imageProps
}: ResponsiveImageProps) {
  const desktop = sources.desktop || fallback || sources.tablet || sources.mobile;
  const tablet = sources.tablet || desktop;
  const mobile = sources.mobile || tablet || desktop;

  if (!desktop) return null;

  return (
    <picture className={pictureClassName} style={pictureStyle}>
      {mobile ? <source media="(max-width: 639px)" srcSet={mobile} /> : null}
      {tablet ? <source media="(max-width: 1023px)" srcSet={tablet} /> : null}
      <img
        {...imageProps}
        src={desktop}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
      />
    </picture>
  );
}

export default ResponsiveImage;
