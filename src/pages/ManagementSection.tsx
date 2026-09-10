import { useAuth } from "@/_core/hooks/useAuth";
import { ContentOperationsOverview } from "@/components/management/ContentOperationsOverview";
import { CommunityOperationsOverview } from "@/components/management/CommunityOperationsOverview";
import { ManagementShell } from "@/components/management/ManagementShell";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChefHat,
  FolderSync,
  Image,
  LayoutGrid,
  Megaphone,
  MessageCircleMore,
  ReceiptText,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";

export type ManagementArea = "conteudos" | "comunidade" | "comercial" | "plataforma";

type Tool = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  masterOnly?: boolean;
};

const areas: Record<
  ManagementArea,
  { eyebrow: string; title: string; description: string; masterOnly?: boolean; tools: Tool[] }
> = {
  conteudos: {
    eyebrow: "Conteúdo e produtos",
    title: "Acervo editorial",
    description: "Organize o que será entregue aos assinantes, da preparação à publicação.",
    tools: [
      {
        title: "Academia Atípica",
        description: "Guias, PDFs, vídeos, capas e ordem.",
        href: "/gestao/conteudos/academia",
        icon: BookOpen,
      },
      {
        title: "Receitas",
        description: "Cadastro, arquivos, capas e publicação.",
        href: "/gestao/conteudos/receitas",
        icon: ChefHat,
      },
      {
        title: "Módulos da Academia",
        description: "Estrutura, capas e disponibilidade.",
        href: "/gestao/conteudos/modulos",
        icon: LayoutGrid,
      },
      {
        title: "Categorias de receitas",
        description: "Organização e navegação do catálogo.",
        href: "/gestao/conteudos/categorias",
        icon: Settings2,
      },
      {
        title: "Importação do Drive",
        description: "Prévia, associação, importação e rollback.",
        href: "/gestao/conteudos/importacao",
        icon: FolderSync,
        masterOnly: true,
      },
    ],
  },
  comunidade: {
    eyebrow: "Comunidade e clientes",
    title: "Relacionamento e cuidado",
    description: "Acompanhe pessoas, modere conversas e preserve uma comunidade segura.",
    tools: [
      {
        title: "Moderação",
        description: "Conversas, respostas e denúncias.",
        href: "/gestao/comunidade/moderacao",
        icon: MessageCircleMore,
      },
      {
        title: "Facilitadores",
        description: "Recursos atuais e preparação do futuro catálogo.",
        href: "/gestao/comunidade/facilitadores",
        icon: ShoppingBag,
      },
    ],
  },
  comercial: {
    eyebrow: "Comercial e vendas",
    title: "Crescimento com controle",
    description: "Centralize catálogo comercial, campanhas, conversões e leitura do funil.",
    masterOnly: true,
    tools: [
      {
        title: "Visão do funil",
        description: "Indicadores comerciais disponíveis hoje.",
        href: "/gestao/comercial/funil",
        icon: BarChart3,
      },
      {
        title: "Produtos",
        description: "Catálogo e destinos comerciais atuais.",
        href: "/gestao/comercial/produtos",
        icon: ShoppingBag,
      },
      {
        title: "Campanhas",
        description: "Links, UTMs e origens de tráfego.",
        href: "/gestao/comercial/campanhas",
        icon: Megaphone,
      },
      {
        title: "Conversões",
        description: "Confirmações e registros operacionais.",
        href: "/gestao/comercial/conversoes",
        icon: ReceiptText,
      },
    ],
  },
  plataforma: {
    eyebrow: "Plataforma e segurança",
    title: "Configurações centrais",
    description: "Gerencie a operação técnica sem misturar configurações com a área dos membros.",
    masterOnly: true,
    tools: [
      {
        title: "Contas e permissões",
        description: "Papéis administrativos e níveis de acesso.",
        href: "/gestao/plataforma/acessos",
        icon: ShieldCheck,
      },
      {
        title: "Aparência",
        description: "Banners e imagens responsivas da plataforma.",
        href: "/gestao/plataforma/aparencia",
        icon: Image,
      },
    ],
  },
};

export default function ManagementSection({ area }: { area: ManagementArea }) {
  const { user } = useAuth();
  const config = areas[area];
  const isMaster = user?.accessRole === "admin_master";
  const tools = config.tools.filter((tool) => isMaster || !tool.masterOnly);

  return (
    <ManagementShell
      eyebrow={config.eyebrow}
      title={config.title}
      description={config.description}
      masterOnly={config.masterOnly}
    >
      {area === "conteudos" ? <ContentOperationsOverview /> : null}
      {area === "comunidade" ? <CommunityOperationsOverview /> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={`${tool.href}-${tool.title}`}
              href={tool.href}
              className="group flex min-h-52 flex-col rounded-3xl border border-[#dfe6ee] bg-white p-6 shadow-[0_14px_36px_rgba(8,31,77,.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(8,31,77,.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/30"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef5ff] text-[#082c62] transition group-hover:bg-[#082c62] group-hover:text-white">
                <Icon size={20} />
              </span>
              <h2 className="mt-6 text-xl font-extrabold">{tool.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#60708a]">{tool.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em]">
                Abrir ferramenta <ArrowUpRight size={15} />
              </span>
            </Link>
          );
        })}
      </section>
    </ManagementShell>
  );
}
