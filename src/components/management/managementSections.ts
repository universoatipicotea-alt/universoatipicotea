import {
  BookOpenCheck,
  MessageCircleMore,
  Settings2,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type ManagementSection = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  masterOnly?: boolean;
};

export const managementSections: ManagementSection[] = [
  {
    href: "/gestao/conteudos",
    label: "Conteúdo e produtos",
    shortLabel: "Conteúdo",
    description: "Academia, receitas, guias, módulos e catálogo editorial.",
    icon: BookOpenCheck,
  },
  {
    href: "/gestao/comunidade",
    label: "Comunidade e clientes",
    shortLabel: "Comunidade",
    description: "Moderação, facilitadores, membros e atendimento.",
    icon: MessageCircleMore,
  },
  {
    href: "/gestao/comercial",
    label: "Comercial e vendas",
    shortLabel: "Comercial",
    description: "Produtos, campanhas, conversões e visão do funil.",
    icon: ShoppingBag,
    masterOnly: true,
  },
  {
    href: "/gestao/plataforma",
    label: "Plataforma e segurança",
    shortLabel: "Plataforma",
    description: "Contas, aparência, integrações e importações.",
    icon: Settings2,
    masterOnly: true,
  },
];
