import { trpc } from "@/lib/trpc";

export type BannerSlot = "login" | "inicio" | "receitas" | "academia" | "plano";

export const BANNER_SLOTS: { slot: BannerSlot; label: string; base: string }[] = [
  { slot: "login", label: "Login / Entrar", base: "/login-universo-atipico" },
  { slot: "inicio", label: "Início (área de membros)", base: "/home-membros-universo-atipico" },
  { slot: "receitas", label: "Receitas", base: "/receitas-universo-atipico" },
  { slot: "academia", label: "Academia Atípica", base: "/academia-universo-atipico" },
  { slot: "plano", label: "Página do plano", base: "/plano-universo-oferta" },
];

type BannerRow = {
  slot: string;
  desktopUrl?: string | null;
  tabletUrl?: string | null;
  mobileUrl?: string | null;
  altText?: string | null;
};

export function useBanner(slot: BannerSlot) {
  const banners = trpc.community.banners.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  return ((banners.data as BannerRow[] | undefined) ?? []).find((row) => row.slot === slot) ?? null;
}

/**
 * Imagem responsiva das áreas principais. Usa as versões otimizadas em WebP
 * (celular / tablet / computador) e permite substituição pelo Admin Master.
 */
export function PlatformBanner({
  slot,
  base,
  alt,
  className = "",
  priority = false,
}: {
  slot: BannerSlot;
  base: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const custom = useBanner(slot);
  const desktop = custom?.desktopUrl || `${base}.webp`;
  const tablet = custom?.tabletUrl || `${base}-md.webp`;
  const mobile = custom?.mobileUrl || `${base}-sm.webp`;
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={desktop} />
      <source media="(min-width: 640px)" srcSet={tablet} />
      <img
        src={mobile}
        alt={custom?.altText || alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // @ts-expect-error atributo válido no navegador
        fetchpriority={priority ? "high" : "auto"}
        className={className}
      />
    </picture>
  );
}
