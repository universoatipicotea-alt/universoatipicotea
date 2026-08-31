import { ArrowRight, BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import { PdfCover } from "@/components/PdfCover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type AcademiaGuide = {
  id: number;
  title: string;
  summary: string;
  category: string;
  coverImageUrl?: string | null;
};

type GuideProgress = {
  sourceType: string;
  documentId: number;
  title: string;
  category: string;
  coverImageUrl?: string | null;
  currentPage: number;
  pageCount: number;
  percent: number;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Academia() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const dashboard = trpc.community.memberDashboard.useQuery(undefined, { enabled: Boolean(user) });
  const publicGuides = trpc.community.publicGuides.useQuery(undefined, { enabled: !user });

  const guides: AcademiaGuide[] = useMemo(
    () => ((user ? dashboard.data?.guides : publicGuides.data) || []) as AcademiaGuide[],
    [user, dashboard.data, publicGuides.data],
  );
  const isLoading = user ? dashboard.isLoading : publicGuides.isLoading;

  const progressByGuide = useMemo(() => {
    const map = new Map<number, GuideProgress>();
    for (const row of (dashboard.data?.progress || []) as GuideProgress[]) {
      if (row.sourceType === "guide") map.set(row.documentId, row);
    }
    return map;
  }, [dashboard.data]);

  const continueReading = useMemo(() => {
    for (const row of (dashboard.data?.progress || []) as GuideProgress[]) {
      if (row.sourceType === "guide" && row.currentPage > 1 && row.percent > 0) return row;
    }
    return null;
  }, [dashboard.data]);

  const categories = useMemo(() => {
    const set = new Map<string, string>();
    for (const guide of guides) {
      const label = (guide.category || "").trim();
      if (label) set.set(normalize(label), label);
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [guides]);

  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState("");

  const visibleGuides = useMemo(() => {
    const term = normalize(search.trim());
    return guides.filter((guide) => {
      const matchesCategory =
        category === "todos" || normalize(guide.category || "") === category;
      const matchesTerm =
        !term ||
        normalize(`${guide.title} ${guide.summary} ${guide.category}`).includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [guides, category, search]);

  const openGuide = (id: number) => setLocation(`/biblioteca?guide=${id}`);

  const ctaLabel = (id: number) => {
    const progress = progressByGuide.get(id);
    if (!progress || progress.currentPage <= 1) return "Começar";
    if (progress.percent >= 100) return "Revisitar";
    return "Continuar";
  };

  return (
    <MemberShell
      allowGuest
      eyebrow="Academia Atípica"
      title="Conhecimento para acompanhar cada momento."
      description="Explore guias e conteúdos organizados para consultar no seu ritmo e voltar sempre que precisar."
    >
      {continueReading ? (
        <section className="mb-10" aria-label="Continue de onde parou">
          <SectionHeading label="Continue de onde parou" title="Retome sua leitura" />
          <article className="soft-card grid gap-6 overflow-hidden rounded-3xl bg-white p-5 sm:grid-cols-[180px_1fr] sm:p-6">
            <PdfCover
              src={continueReading.coverImageUrl}
              title={continueReading.title}
              className="rounded-2xl"
            />
            <div className="flex min-w-0 flex-col">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
                {continueReading.category}
              </p>
              <h3 className="display-font mt-2 text-3xl font-semibold leading-tight">
                {continueReading.title}
              </h3>
              <div className="mt-5 max-w-md">
                <div className="mb-2 flex justify-between text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  <span>Progresso</span>
                  <span>{continueReading.percent}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-[var(--linen)]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={continueReading.percent}
                  aria-label={`Progresso da leitura: ${continueReading.percent}%`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--sage-deep)] transition-[width] duration-300"
                    style={{ width: `${continueReading.percent}%` }}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => openGuide(continueReading.documentId)}
                className="pressable mt-6 w-fit rounded-xl bg-[var(--sage-deep)] px-4 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
              >
                Continuar da página {continueReading.currentPage}
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </article>
        </section>
      ) : null}

      <section id="materiais-academia" className="scroll-mt-24">
        <SectionHeading
          label="Explore a Academia"
          title="Escolha um conteúdo para começar"
        />
        <p className="-mt-3 mb-6 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          Escolha um conteúdo para começar ou continue explorando os temas disponíveis.
        </p>

        {guides.length ? (
          <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[{ key: "todos", label: "Todos" }, ...categories.map((label) => ({ key: normalize(label), label }))].map(
                (item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                    className={`rounded-full px-3.5 py-2 text-xs font-extrabold transition ${
                      category === item.key
                        ? "bg-[var(--sage-deep)] text-white"
                        : "bg-[var(--linen)] text-[var(--ink-soft)] hover:bg-[var(--sage-pale)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
            <div className="relative w-full lg:w-72">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar na Academia"
                aria-label="Buscar na Academia"
                className="h-11 rounded-xl border-[var(--line)] bg-white pl-9 text-sm"
              />
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-96 animate-pulse rounded-3xl bg-[var(--linen)]" />
            <div className="h-96 animate-pulse rounded-3xl bg-[var(--linen)]" />
            <div className="h-96 animate-pulse rounded-3xl bg-[var(--linen)]" />
          </div>
        ) : visibleGuides.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleGuides.map((guide) => (
              <article
                key={guide.id}
                className="soft-card flex flex-col overflow-hidden rounded-3xl bg-white"
              >
                <PdfCover src={guide.coverImageUrl} title={guide.title} />
                <div className="flex flex-1 flex-col gap-0 p-5 [&>button]:mt-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
                    {guide.category}
                  </p>
                  <h3 className="display-font mt-2 text-2xl font-semibold leading-tight">
                    {guide.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">
                    {guide.summary}
                  </p>
                  <Button
                    type="button"
                    onClick={() => openGuide(guide.id)}
                    className="pressable mt-auto w-full rounded-xl bg-[var(--sage-deep)] px-3 py-2 text-xs font-extrabold text-white hover:bg-[var(--ink)] sm:w-fit"
                  >
                    {ctaLabel(guide.id)} <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : guides.length ? (
          <ContentEmpty
            icon={Search}
            title="Nenhum conteúdo encontrado"
            text="Ajuste a busca ou selecione outra categoria."
          />
        ) : (
          <ContentEmpty
            icon={BookOpen}
            title="Nenhum conteúdo publicado"
            text="Assim que a administração publicar um guia, ele aparecerá aqui."
          />
        )}
      </section>
    </MemberShell>
  );
}
