import {
  BarChart3,
  BookOpenCheck,
  ChefHat,
  FolderSync,
  GraduationCap,
  Image,
  Layers3,
  Megaphone,
  MessageCircleMore,
  ReceiptText,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type ManagementDestination = {
  href: string;
  label: string;
  icon: LucideIcon;
  masterOnly?: boolean;
};

export type ManagementSection = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  masterOnly?: boolean;
  destinations: ManagementDestination[];
};

export const managementSections: ManagementSection[] = [
  {
    href: "/gestao/academia",
    label: "Academia Atípica",
    shortLabel: "Academia",
    description: "Aulas, módulos e materiais da Academia Atípica.",
    icon: GraduationCap,
    destinations: [
      { href: "/gestao/academia", label: "Visão geral", icon: BookOpenCheck },
      { href: "/gestao/academia/modulos", label: "Módulos", icon: Layers3 },
      { href: "/gestao/academia/aulas", label: "Aulas", icon: GraduationCap },
    ],
  },
  {
    href: "/gestao/receitas",
    label: "Receitas",
    shortLabel: "Receitas",
    description: "Catálogo de receitas e categorias.",
    icon: ChefHat,
    destinations: [
      { href: "/gestao/receitas", label: "Visão geral", icon: ChefHat },
      { href: "/gestao/receitas/categorias", label: "Categorias", icon: Settings2 },
    ],
  },
  {
    href: "/gestao/conteudos",
    label: "Conteúdo e produtos",
    shortLabel: "Conteúdo",
    description: "Importações e catálogo editorial complementar.",
    icon: BookOpenCheck,
    masterOnly: true,
    destinations: [
      {
        href: "/gestao/conteudos/importacao",
        label: "Importação do Drive",
        icon: FolderSync,
        masterOnly: true,
      },
    ],
  },
  {
    href: "/gestao/comunidade",
    label: "Comunidade e clientes",
    shortLabel: "Comunidade",
    description: "Moderação, membros e atendimento.",
    icon: MessageCircleMore,
    destinations: [
      {
        href: "/gestao/comunidade/moderacao",
        label: "Moderação",
        icon: MessageCircleMore,
      },
    ],
  },
  {
    href: "/gestao/lojamundoazul",
    label: "Loja Mundo Azul",
    shortLabel: "Loja",
    description: "Produtos, categorias, coleções e vitrine pública.",
    icon: ShoppingBag,
    destinations: [{ href: "/gestao/lojamundoazul", label: "Gestão da loja", icon: ShoppingBag }],
  },
  {
    href: "/gestao/comercial",
    label: "Comercial e vendas",
    shortLabel: "Comercial",
    description: "Produtos, campanhas, conversões e visão do funil.",
    icon: ShoppingBag,
    masterOnly: true,
    destinations: [
      { href: "/gestao/comercial/funil", label: "Visão do funil", icon: BarChart3 },
      { href: "/gestao/comercial/produtos", label: "Produtos", icon: ShoppingBag },
      { href: "/gestao/comercial/campanhas", label: "Campanhas", icon: Megaphone },
      { href: "/gestao/comercial/conversoes", label: "Conversões", icon: ReceiptText },
    ],
  },
  {
    href: "/gestao/plataforma",
    label: "Plataforma e segurança",
    shortLabel: "Plataforma",
    description: "Contas, aparência, integrações e importações.",
    icon: Settings2,
    masterOnly: true,
    destinations: [
      {
        href: "/gestao/plataforma/acessos",
        label: "Contas e permissões",
        icon: ShieldCheck,
      },
      { href: "/gestao/plataforma/aparencia", label: "Aparência", icon: Image },
    ],
  },
];
