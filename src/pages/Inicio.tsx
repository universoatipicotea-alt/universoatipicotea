import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import ResponsiveVisualAsset from "@/components/ResponsiveVisualAsset";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  ChefHat,
  GraduationCap,
  MessageCircleMore,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

type Shortcut = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

const shortcuts: Shortcut[] = [
  {
    href: "/receitas",
    label: "Receitas",
    description: "Ideias práticas para facilitar as refeições e a rotina.",
    icon: ChefHat,
    iconClassName: "bg-[#fff1d2] text-[#a46100]",
  },
  {
    href: "/academia",
    label: "Academia Atípica",
    description: "Conteúdos organizados para aprender no seu ritmo.",
    icon: GraduationCap,
    iconClassName: "bg-[#e2f2ff] text-[#0f6ba8]",
  },
  {
    href: "/biblioteca",
    label: "Biblioteca",
    description: "Guias e materiais para consultar quando precisar.",
    icon: BookMarked,
    iconClassName: "bg-[#e4f5ec] text-[#17795b]",
  },
  {
    href: "/comunidade",
    label: "Comunidade",
    description: "Um espaço para trocar experiências e caminhar junto.",
    icon: MessageCircleMore,
    iconClassName: "bg-[#ffe5e4] text-[#b53640]",
  },
];

function SectionShell({
  label,
  title,
  actionLabel,
  actionHref,
  children,
}: {
  label: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
}) {
  const titleId = `${label.toLowerCase()}-title`;

  return (
    <section className="mt-10 sm:mt-12" aria-labelledby={titleId}>
      <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
            {label}
          </p>
          <h2 id={titleId} className="display-font text-3xl font-semibold tracking-[-0.03em]">
            {title}
          </h2>
        </div>
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="rounded-lg py-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--sage-deep)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ShortcutCard({ shortcut }: { shortcut: Shortcut }) {
  const Icon = shortcut.icon;

  return (
    <Link
      href={shortcut.href}
      aria-label={`${shortcut.label}: ${shortcut.description}`}
      className="group flex min-h-36 min-w-0 items-start gap-4 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_10px_26px_rgba(8,31,77,.055)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--sage)] hover:shadow-[0_16px_34px_rgba(8,31,77,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2 sm:min-h-40 sm:flex-col"
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${shortcut.iconClassName}`}
        aria-hidden="true"
      >
        <Icon size={23} strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 items-start gap-3 sm:w-full">
        <span className="min-w-0 flex-1">
          <strong className="display-font block text-xl font-semibold leading-tight text-[var(--ink)]">
            {shortcut.label}
          </strong>
          <span className="mt-2 block text-sm leading-6 text-[var(--ink-soft)]">
            {shortcut.description}
          </span>
        </span>
        <ArrowRight
          size={18}
          className="mt-1 shrink-0 text-[var(--sage-deep)] transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

const eyebrow = "Início";
const title = "Bem-vindo ao seu Universo.";
const description = "Tudo o que você precisa, organizado para encontrar com facilidade.";

export default function Inicio() {
  const [, setLocation] = useLocation();
  const dashboard = trpc.community.memberDashboard.useQuery();
  const taxonomy = trpc.community.taxonomy.useQuery();
  const data = dashboard.data;

  if (dashboard.isLoading) {
    return (
      <MemberShell eyebrow={eyebrow} title={title} description={description}>
        <div className="min-w-0 pb-20 lg:pb-0" aria-busy="true" aria-label="Carregando início">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-3xl bg-[var(--linen)] sm:h-40"
              />
            ))}
          </div>
          <div className="mt-10 h-8 w-64 max-w-full animate-pulse rounded-xl bg-[var(--linen)]" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl bg-[var(--linen)]" />
            ))}
          </div>
        </div>
      </MemberShell>
    );
  }

  if (dashboard.isError) {
    const restricted = dashboard.error?.message?.startsWith("ACESSO_RESTRITO");

    return (
      <MemberShell eyebrow={eyebrow} title={title} description={description}>
        <div className="pb-20 lg:pb-0">
          <ContentEmpty
            icon={BookOpen}
            title={
              restricted
                ? "Seu acesso ainda não está ativo"
                : "Não conseguimos abrir seu início agora"
            }
            text={
              restricted
                ? "A assinatura de R$ 49,90/mês libera todo o Universo Atípico. Verifique o status em Minha assinatura."
                : "Tente atualizar a página em alguns instantes."
            }
          />
          {restricted ? (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setLocation("/minha-assinatura")}
                className="pressable h-12 w-full rounded-xl bg-[var(--sage-deep)] px-6 font-bold text-white hover:bg-[var(--ink)] sm:w-auto"
              >
                Ver minha assinatura <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          ) : null}
        </div>
      </MemberShell>
    );
  }

  const progress = (data?.progress ?? []).slice(0, 3);

  const openGuide = (id: number) => {
    const guide = data?.guides?.find((item) => item.id === id);
    const module = taxonomy.data?.academyModules?.find((item) => item.id === guide?.moduleId);
    setLocation(module ? `/academia/${module.slug}?guide=${id}` : "/academia");
  };

  const openRecipe = (id: number) => setLocation(`/receitas?guide=${id}`);

  return (
    <MemberShell eyebrow={eyebrow} title={title} description={description}>
      <div className="min-w-0 pb-20 lg:pb-0">
        <ResponsiveVisualAsset
          slot="home"
          fallback={{
            desktopImageUrl: "/home-membros-universo-atipico-desktop.webp",
            tabletImageUrl: "/home-membros-universo-atipico-tablet.webp",
            mobileImageUrl: "/home-membros-universo-atipico-mobile.webp",
            altText: "Uma vida mais leve, juntos — Universo Atípico",
          }}
          defaultAlt="Imagem de apoio da área de membros"
          pictureClassName="mb-8 aspect-video overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_14px_38px_rgba(8,31,77,.08)]"
          className="h-full w-full object-contain"
          sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc(100vw - 64px), 1200px"
        />
        <section aria-label="Atalhos principais">
          <SectionHeading label="Comece por aqui" title="Encontre o que precisa" />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {shortcuts.map((shortcut) => (
              <ShortcutCard key={shortcut.href} shortcut={shortcut} />
            ))}
          </div>
        </section>

        <SectionShell
          label="Continuar"
          title="Continue de onde parou"
          actionLabel="Ver biblioteca"
          actionHref="/biblioteca"
        >
          {progress.length ? (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {progress.map((item) => {
                const percent = Math.min(100, Math.max(0, item.percent));
                const continueLabel = `Continuar da página ${item.currentPage}`;

                return (
                  <button
                    key={`${item.sourceType}-${item.documentId}`}
                    type="button"
                    onClick={() =>
                      item.sourceType === "testGuide"
                        ? openRecipe(item.documentId)
                        : openGuide(item.documentId)
                    }
                    aria-label={`${continueLabel}: ${item.title}`}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-white text-left shadow-[0_10px_26px_rgba(8,31,77,.055)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--sage)] hover:shadow-[0_16px_34px_rgba(8,31,77,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2"
                  >
                    <span
                      className="grid aspect-[16/9] w-full place-items-center overflow-hidden border-b border-[var(--line)] bg-[var(--linen)]"
                      style={{ backgroundColor: item.accentColor || "var(--linen)" }}
                    >
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={`Capa de ${item.title}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <BookOpen
                          size={32}
                          className="text-[var(--sage-deep)]"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col p-5">
                      {item.category ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">
                          {item.category}
                        </span>
                      ) : null}
                      <strong className="display-font mt-2 line-clamp-2 text-xl font-semibold leading-tight text-[var(--ink)]">
                        {item.title}
                      </strong>
                      <span className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--linen)]">
                        <span
                          className="progress-shimmer block h-full rounded-full bg-[var(--sage-deep)]"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="mt-2 text-[11px] font-bold text-[var(--ink-soft)]">
                        {percent}% · página {item.currentPage}
                        {item.pageCount ? ` de ${item.pageCount}` : ""}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-2 border-t border-[var(--line)] pt-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[var(--sage-deep)]">
                        {continueLabel}
                        <ArrowRight
                          size={14}
                          className="transition-transform duration-200 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <ContentEmpty
              icon={BookOpen}
              title="Nenhuma leitura em andamento"
              text="Quando você abrir um guia ou receita, ele aparecerá aqui para continuar depois."
            />
          )}
        </SectionShell>
      </div>
    </MemberShell>
  );
}
