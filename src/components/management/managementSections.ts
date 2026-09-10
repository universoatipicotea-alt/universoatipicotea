import {
  BarChart3,
  BookOpenCheck,
  ChefHat,
  FolderSync,
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
    href: "/gestao/conteudos",
    label: "Conteúdo e produtos",
    shortLabel: "Conteúdo",
    description: "Academia, receitas, guias, módulos e catálogo editorial.",
    icon: BookOpenCheck,
    destinations: [
      { href: "/gestao/conteudos/academia", label: "Academia Atípica", icon: BookOpenCheck },
      { href: "/gestao/conteudos/receitas", label: "Receitas", icon: ChefHat },
      { href: "/gestao/conteudos/modulos", label: "Módulos", icon: Layers3 },
      { href: "/gestao/conteudos/categorias", label: "Categorias", icon: Settings2 },
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
    description: "Moderação, facilitadores, membros e atendimento.",
    icon: MessageCircleMore,
    destinations: [
      {
        href: "/gestao/comunidade/moderacao",
        label: "Moderação",
        icon: MessageCircleMore,
      },
      {
        href: "/gestao/comunidade/facilitadores",
        label: "Facilitadores",
        icon: ShoppingBag,
      },
    ],
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
