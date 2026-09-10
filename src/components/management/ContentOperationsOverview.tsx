import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpen,
  ChefHat,
  CircleAlert,
  FilePenLine,
  Layers3,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="rounded-3xl border border-[#dfe6ee] bg-white p-5 shadow-[0_12px_30px_rgba(8,31,77,.04)]">
      <strong className="display-font block text-4xl font-semibold tracking-[-.04em]">
        {value}
      </strong>
      <span className="mt-2 block text-sm font-extrabold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-[#60708a]">{detail}</span>
    </article>
  );
}

function StatusRow({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="group flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-[#dfe6ee] bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/30"
    >
      <span className="font-bold text-[#60708a]">{label}</span>
      <span className="inline-flex items-center gap-2 font-extrabold text-[#082c62]">
        {value} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function ContentOperationsOverview() {
  const { user } = useAuth();
  const enabled = ["admin", "admin_master"].includes(user?.accessRole || "");
  const dashboard = trpc.community.admin.dashboard.useQuery(undefined, { enabled });
  const recipes = trpc.community.admin.testGuides.useQuery(undefined, { enabled });
  const taxonomy = trpc.community.admin.taxonomy.useQuery(undefined, { enabled });

  if (dashboard.isLoading || recipes.isLoading || taxonomy.isLoading) {
    return (
      <section
        className="mb-8 flex min-h-40 items-center justify-center rounded-3xl border border-[#dfe6ee] bg-white"
        aria-label="Carregando visão do acervo"
      >
        <Loader2 className="animate-spin text-[#2f8f68]" size={24} />
      </section>
    );
  }

  if (dashboard.isError || recipes.isError || taxonomy.isError) {
    return (
      <section className="mb-8 rounded-3xl border border-[#f2c7c2] bg-[#fff6f4] p-6">
        <CircleAlert className="text-[#d64e45]" size={22} />
        <h2 className="mt-4 text-lg font-extrabold">A visão do acervo não carregou</h2>
        <p className="mt-2 text-sm leading-6 text-[#60708a]">
          As ferramentas continuam disponíveis abaixo. Atualize a página para tentar carregar os
          indicadores novamente.
        </p>
      </section>
    );
  }

  const guides = dashboard.data?.guides ?? [];
  const recipeItems = recipes.data ?? [];
  const modules = taxonomy.data?.academyModules ?? [];
  const categories = taxonomy.data?.recipeCategories ?? [];
  const publishedGuides = guides.filter((item) => item.status === "published").length;
  const draftGuides = guides.filter((item) => item.status === "draft").length;
  const publishedRecipes = recipeItems.filter((item) => item.status === "published").length;
  const draftRecipes = recipeItems.filter((item) => item.status === "draft").length;
  const publishedModules = modules.filter((item) => item.status === "published").length;
  const comingSoonModules = modules.filter((item) => item.status === "coming_soon").length;
  const activeCategories = categories.filter((item) => item.status === "published").length;

  return (
    <section className="mb-10" aria-labelledby="content-operations-title">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#2f8f68]">
            Dados reais do acervo
          </p>
          <h2 id="content-operations-title" className="display-font mt-2 text-3xl font-semibold">
            Visão operacional
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/gestao/conteudos/academia"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#082c62] px-4 text-xs font-extrabold text-white"
          >
            <BookOpen size={16} /> Novo conteúdo
          </Link>
          <Link
            href="/gestao/conteudos/receitas"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cdd8e6] bg-white px-4 text-xs font-extrabold"
          >
            <ChefHat size={16} /> Nova receita
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Academia publicada"
          value={publishedGuides}
          detail="Conteúdos disponíveis aos membros"
        />
        <Metric
          label="Receitas publicadas"
          value={publishedRecipes}
          detail="Receitas disponíveis no catálogo"
        />
        <Metric
          label="Módulos publicados"
          value={publishedModules}
          detail={`${modules.length} módulos cadastrados`}
        />
        <Metric
          label="Categorias ativas"
          value={activeCategories}
          detail={`${categories.length} categorias cadastradas`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-3xl bg-[#082c62] p-6 text-white sm:p-7">
          <FilePenLine className="text-[#f4c96b]" size={22} />
          <h3 className="display-font mt-5 text-3xl font-semibold">Fila editorial</h3>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Acompanhe o que ainda está em preparação antes de disponibilizar aos membros.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <StatusRow
              label="Conteúdos em rascunho"
              value={draftGuides}
              href="/gestao/conteudos/academia"
            />
            <StatusRow
              label="Receitas em rascunho"
              value={draftRecipes}
              href="/gestao/conteudos/receitas"
            />
          </div>
        </article>
        <article className="rounded-3xl border border-[#dfe6ee] bg-[#f7fbff] p-6 sm:p-7">
          <Layers3 className="text-[#2f8f68]" size={22} />
          <h3 className="mt-5 text-lg font-extrabold">Estrutura do catálogo</h3>
          <p className="mt-2 text-sm leading-6 text-[#60708a]">
            Organize módulos e categorias antes da publicação para manter a navegação consistente.
          </p>
          <div className="mt-5 space-y-2">
            <StatusRow
              label="Módulos em breve"
              value={comingSoonModules}
              href="/gestao/conteudos/modulos"
            />
            <StatusRow
              label="Categorias cadastradas"
              value={categories.length}
              href="/gestao/conteudos/categorias"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
