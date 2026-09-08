export const VISUAL_ASSET_SLOT_DEFINITIONS = {
  inicio: {
    label: "Home da área de membros",
    route: "/inicio",
    description: "Apoio visual da abertura da área de membros.",
    recommended: {
      desktop: "1600 × 900 px",
      tablet: "1200 × 900 px",
      mobile: "750 × 1000 px",
    },
  },
  receitas: {
    label: "Receitas",
    route: "/receitas",
    description: "Capa principal do hub de receitas.",
    recommended: {
      desktop: "1600 × 900 px",
      tablet: "1200 × 900 px",
      mobile: "750 × 1000 px",
    },
  },
  academia: {
    label: "Academia Atípica",
    route: "/academia",
    description: "Capa principal do hub da Academia Atípica.",
    recommended: {
      desktop: "1600 × 900 px",
      tablet: "1200 × 900 px",
      mobile: "750 × 1000 px",
    },
  },
  plano: {
    label: "Página da assinatura",
    route: "/assinatura",
    description: "Arte de apoio do Plano Universo. Preço e CTA permanecem em HTML.",
    recommended: {
      desktop: "1200 × 1500 px",
      tablet: "900 × 1200 px",
      mobile: "750 × 1200 px",
    },
  },
  public_home: {
    label: "Página pública principal",
    route: "/",
    description: "Apoio visual da apresentação pública do Universo Atípico.",
    recommended: {
      desktop: "1920 × 900 px",
      tablet: "1200 × 900 px",
      mobile: "750 × 1000 px",
    },
  },
  checkout: {
    label: "Checkout",
    route: "/checkout",
    description: "Arte de apoio da oferta. Preço e CTA permanecem em HTML.",
    recommended: {
      desktop: "1920 × 768 px",
      tablet: "1200 × 900 px",
      mobile: "750 × 1000 px",
    },
  },
  login: {
    label: "Login",
    route: "/entrar",
    description: "Imagem do painel de acolhimento da autenticação.",
    recommended: {
      desktop: "1200 × 1600 px",
      tablet: "1024 × 1200 px",
      mobile: "750 × 900 px",
    },
  },
  public_camila: {
    label: "Página pública da Camila",
    route: "/camilaribeiroautismo",
    description: "Asset opcional da página pública, sem substituir a logo oficial.",
    recommended: {
      desktop: "1440 × 720 px",
      tablet: "1024 × 768 px",
      mobile: "750 × 1000 px",
    },
  },
} as const;

export type VisualAssetSlot = keyof typeof VISUAL_ASSET_SLOT_DEFINITIONS;

export type VisualAssetSourceInput = {
  desktopImageUrl?: string | null;
  tabletImageUrl?: string | null;
  mobileImageUrl?: string | null;
  altText?: string | null;
};

export type VisualAssetPublic = Required<Pick<VisualAssetSourceInput, "altText">> & {
  slot: VisualAssetSlot;
  desktopImageUrl: string;
  tabletImageUrl: string | null;
  mobileImageUrl: string | null;
};

export type ResolvedVisualAsset = {
  desktop: string;
  tablet: string;
  mobile: string;
  altText: string;
};

export const VISUAL_ASSET_SLOTS = Object.keys(VISUAL_ASSET_SLOT_DEFINITIONS) as VisualAssetSlot[];

export function isVisualAssetSlot(value: unknown): value is VisualAssetSlot {
  return typeof value === "string" && VISUAL_ASSET_SLOTS.includes(value as VisualAssetSlot);
}

function clean(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Resolve as variantes sem quebrar a página: mobile → tablet → desktop.
 * Quando existe uma configuração ativa, as variantes dela têm prioridade sobre
 * o asset local usado como último fallback pela página.
 */
export function resolveVisualAssetSources(
  asset?: VisualAssetSourceInput | null,
  fallback?: VisualAssetSourceInput | null,
): ResolvedVisualAsset {
  const assetDesktop = clean(asset?.desktopImageUrl);
  const assetTablet = clean(asset?.tabletImageUrl);
  const assetMobile = clean(asset?.mobileImageUrl);
  const fallbackDesktop = clean(fallback?.desktopImageUrl);
  const fallbackTablet = clean(fallback?.tabletImageUrl);
  const fallbackMobile = clean(fallback?.mobileImageUrl);

  const desktop = assetDesktop || fallbackDesktop;
  const tablet = assetTablet || assetDesktop || fallbackTablet || fallbackDesktop;
  const mobile =
    assetMobile ||
    assetTablet ||
    assetDesktop ||
    fallbackMobile ||
    fallbackTablet ||
    fallbackDesktop;

  return {
    desktop,
    tablet: tablet || desktop,
    mobile: mobile || tablet || desktop,
    altText: clean(asset?.altText) || clean(fallback?.altText),
  };
}
