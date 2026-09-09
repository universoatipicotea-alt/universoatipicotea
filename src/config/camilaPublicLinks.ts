export const camilaProfile = {
  handle: "@CamilaRibeiroAutismo",
  description: "🌞 Mãe atípica | Dia a dia no mundo do autismo 🌻💐",
  supportText: "Tudo que faz parte da minha jornada, reunido em um só lugar.",
};

export const camilaExternalDestinations = {
  lacosDoEspectro: "https://chat.whatsapp.com/IWStSJt769GJDWYHqCMsJp?s=cl&p=i&mlu=4&ilr=4",
  mundoAzulTikTok: "https://vt.tiktok.com/ZS9jh9ggHCF3M-BfaeN",
  mundoAzulAlternative: "https://tr.ee/oROBENGyFa",
} as const;

export const camilaSocialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/camila.ribeiro.autismo",
    event: "camila_instagram",
  },
  {
    label: "WhatsApp",
    href: "https://api.whatsapp.com/send?phone=5577981680011",
    event: "camila_whatsapp",
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@camila.ribeiro.autismo",
    event: "camila_tiktok",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/camila.alvespereiraribeiro",
    event: "camila_facebook",
  },
] as const;

export const camilaPrimaryLinks = [
  {
    title: "Universo Atípico",
    description: "Conhecimento, recursos e comunidade para famílias atípicas.",
    href: "https://universoatipico.app",
    event: "camila_universo_atipico",
    accent: "coral",
    brand: "universo",
  },
  {
    title: "Laços do Espectro",
    description: "Comunidade no WhatsApp para troca, apoio e conexão.",
    href: camilaExternalDestinations.lacosDoEspectro,
    event: "camila_lacos_espectro",
    accent: "green",
    brand: "image",
    imageSrc: "/camila-lacos-do-espectro.png",
    imageAlt: "Logo do Laços do Espectro",
  },
  {
    title: "AtualizaTEA",
    description: "Conteúdos, informações e atualizações sobre o universo do autismo.",
    href: "https://t.me/+NPvBuRydXI5iYjJh",
    event: "camila_atualizatea",
    accent: "blue",
    brand: "image",
    imageSrc: "/camila-atualizatea.webp",
    imageAlt: "Logo do canal AtualizaTEA",
  },
  {
    title: "Mundo Azul — Loja",
    description: "Produtos e recursos selecionados para famílias atípicas.",
    href: camilaExternalDestinations.mundoAzulTikTok,
    event: "camila_mundo_azul",
    accent: "yellow",
    brand: "image",
    imageSrc: "/camila-mundo-azul.png",
    imageAlt: "Logo da loja Mundo Azul",
  },
] as const;

export type CamilaLinkEvent =
  (typeof camilaSocialLinks)[number]["event"] | (typeof camilaPrimaryLinks)[number]["event"];
