import { ArrowRight, BookOpen, ChefHat, Clock3, Sparkles, Utensils } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import { RecipeCover } from "@/components/RecipeCover";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Academia() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const testGuides = trpc.community.publicAcademiaGuides.useQuery();
  const recipes = useMemo(
    () =>
      (testGuides.data || []).filter((guide) =>
        guide.category.toLocaleLowerCase("pt-BR").includes("aliment"),
      ),
    [testGuides.data],
  );
  const isMember = Boolean(
    user && (["admin", "master"].includes(user.role) || user.membershipStatus === "member"),
  );
  const featuredGuideId = recipes[0]?.id ?? 0;
  const readingProgress = trpc.community.readingProgress.get.useQuery(
    { sourceType: "testGuide", documentId: Math.max(1, featuredGuideId) },
    { enabled: Boolean(isMember && featuredGuideId) },
  );
  const progressPercent = readingProgress.data?.pageCount
    ? Math.min(
        100,
        Math.round((readingProgress.data.currentPage / readingProgress.data.pageCount) * 100),
      )
    : 0;

  return (
    <MemberShell
      allowGuest
      eyebrow="Academia Atípica"
      title="Receitas possíveis para a rotina real."
      description="Receitas, estratégias e caminhos para tornar a alimentação mais leve, respeitando o ritmo e as possibilidades de cada família."
    >
      <section className="relative overflow-hidden rounded-[2rem] bg-[var(--sage-deep)] p-7 text-white sm:p-10 lg:p-12">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-24 right-24 h-52 w-52 rounded-full border border-[#efd4a2]/20" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#efd4a2]">
              <Sparkles size={13} /> Receitas do Universo
            </span>
            <h2 className="display-font mt-6 max-w-3xl text-4xl font-semibold leading-[0.94] tracking-[-0.04em] sm:text-6xl">
              Descobrir, experimentar e cuidar da rotina.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Receitas e estratégias para transformar informação em pequenos passos possíveis,
              respeitando o ritmo de cada família.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() =>
                  document
                    .getElementById("materiais-academia")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="pressable h-11 rounded-xl bg-[#efd4a2] px-5 text-xs font-extrabold text-[var(--ink)] hover:bg-white"
              >
                Explorar materiais <ArrowRight size={15} className="ml-2" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/vsl")}
                className="h-11 rounded-xl border-white/25 bg-transparent px-5 text-xs font-extrabold text-white hover:bg-white/10"
              >
                Quero fazer parte
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <ChefHat size={20} className="text-[#efd4a2]" />
              <p className="mt-5 text-sm font-extrabold">Receitas possíveis</p>
              <p className="mt-1 text-xs leading-5 text-white/65">
                Ideias para diferentes momentos da rotina.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <Utensils size={20} className="text-[#efd4a2]" />
              <p className="mt-5 text-sm font-extrabold">Estratégias práticas</p>
              <p className="mt-1 text-xs leading-5 text-white/65">
                Materiais para consultar e adaptar.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <BookOpen size={20} className="text-[#efd4a2]" />
              <p className="mt-5 text-sm font-extrabold">Leitura protegida</p>
              <p className="mt-1 text-xs leading-5 text-white/65">
                Acesse tudo dentro da plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]"
        aria-label="Sua trilha de aprendizagem"
      >
        <article className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_10px_24px_rgba(8,31,77,.04)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
                Sua trilha
              </p>
              <h2 className="display-font mt-2 text-3xl font-semibold leading-none">
                Comece por um pequeno passo.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Acompanhe os materiais na ordem que fizer sentido. O progresso aparece aqui depois
                que você iniciar uma leitura.
              </p>
            </div>
            <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-xs font-extrabold text-[var(--sage-deep)]">
              Trilha 01
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-extrabold">
            <span className="rounded-full bg-[var(--sage-deep)] px-3 py-1.5 text-white">
              1. Conhecer
            </span>
            <span className="text-[var(--ink-soft)]">→</span>
            <span className="rounded-full bg-[var(--linen)] px-3 py-1.5 text-[var(--ink-soft)]">
              2. Experimentar
            </span>
            <span className="text-[var(--ink-soft)]">→</span>
            <span className="rounded-full bg-[var(--linen)] px-3 py-1.5 text-[var(--ink-soft)]">
              3. Adaptar
            </span>
          </div>
        </article>
        <aside className="min-w-0 rounded-3xl bg-[var(--linen)] p-6 lg:w-72">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--clay)]">
              Seu progresso
            </span>
            <span className="text-sm font-extrabold text-[var(--ink)]">{progressPercent}%</span>
          </div>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label={`Progresso da trilha: ${progressPercent}%`}
          >
            <div
              className="h-full rounded-full bg-[var(--sage-deep)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--ink-soft)]">
            {readingProgress.data?.currentPage
              ? `Você está na página ${readingProgress.data.currentPage} de ${readingProgress.data.pageCount}.`
              : "Ainda não iniciada. Escolha um material para começar."}
          </p>
        </aside>
      </section>

      <section id="materiais-academia" className="mt-12 scroll-mt-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading label="Trilha de alimentação" title="Materiais para começar" />
          <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-xs font-extrabold text-[var(--sage-deep)]">
            {recipes.length} {recipes.length === 1 ? "material" : "materiais"}
          </span>
        </div>
        {testGuides.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-80 animate-pulse rounded-3xl bg-[var(--linen)]" />
            <div className="h-80 animate-pulse rounded-3xl bg-[var(--linen)]" />
            <div className="h-80 animate-pulse rounded-3xl bg-[var(--linen)]" />
          </div>
        ) : recipes.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recipes.map((guide) => (
              <article
                key={guide.id}
                className="soft-card flex flex-col overflow-hidden rounded-3xl bg-white"
              >
                <div className="relative h-44" style={{ backgroundColor: guide.accentColor }}>
                  {guide.coverImageUrl ? (
                    <img
                      src={guide.coverImageUrl}
                      alt={`Capa de ${guide.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <RecipeCover title={guide.title} accentColor={guide.accentColor} />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--sage-deep)]">
                    Alimentação
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="display-font text-2xl font-semibold leading-tight">
                    {guide.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">
                    {guide.summary}
                  </p>
                  {guide.callout ? (
                    <p className="mt-4 border-l-2 border-[var(--clay)] pl-3 text-xs font-semibold leading-5 text-[var(--ink-soft)]">
                      {guide.callout}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink-soft)]">
                      <Clock3 size={13} /> {formatDate(guide.updatedAt)}
                    </span>
                    <Button
                      type="button"
                      onClick={() =>
                        setLocation(
                          isMember
                            ? `/receitas?guide=${guide.id}`
                            : "/checkout",
                        )
                      }
                      className="pressable rounded-xl bg-[var(--sage-deep)] px-3 py-2 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
                    >
                      {isMember ? "Ler receita" : "Conhecer o acesso"}{" "}
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ContentEmpty
            icon={ChefHat}
            title="A trilha está começando"
            text="Os próximos materiais de alimentação aparecerão aqui assim que forem publicados pela administração."
          />
        )}
      </section>

      <section className="mt-12 rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[0_10px_24px_rgba(8,31,77,.04)] sm:p-9">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--clay)]">
              Acesso completo em preparação
            </p>
            <h2 className="display-font mt-3 max-w-xl text-3xl font-semibold leading-tight">
              Mais possibilidades para a sua rotina.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Uma futura assinatura reunirá receitas completas, novas jornadas, comunidade e
              conteúdos exclusivos em um só Universo.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-[var(--linen)] p-5 lg:min-w-56">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">
              Universo Atípico
            </p>
            <p className="display-font mt-2 text-3xl font-semibold">
              R$ 49,90
              <span className="font-sans text-sm font-bold text-[var(--ink-soft)]">/mês</span>
            </p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Plano visual preparado, cobrança desativada.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-extrabold text-[var(--ink-soft)]">
          <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[var(--sage-deep)]">
            Receitas completas
          </span>
          <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[var(--sage-deep)]">
            Novos conteúdos
          </span>
          <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[var(--sage-deep)]">
            Academia Atípica
          </span>
          <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[var(--sage-deep)]">
            Comunidade
          </span>
          <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[var(--sage-deep)]">
            Materiais exclusivos
          </span>
        </div>
        <Button
          type="button"
          onClick={() => setLocation("/assinatura")}
          className="pressable mt-6 rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"
        >
          Conhecer o acesso <ArrowRight size={14} className="ml-2" />
        </Button>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-3xl border border-[var(--line)] bg-[#ede7da] p-7 sm:p-9">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
            Uma experiência em construção
          </p>
          <h2 className="display-font mt-3 max-w-xl text-3xl font-semibold leading-tight">
            Conhecimento que vira repertório para a vida real.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            A Academia Atípica será o espaço para reunir aulas, guias e materiais especiais. Por
            enquanto, comece pelos conteúdos de alimentação disponíveis.
          </p>
        </article>
        <article className="rounded-3xl bg-[var(--linen)] p-7 sm:p-9">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--clay)]">
            Próximo passo
          </p>
          <h2 className="display-font mt-3 text-3xl font-semibold leading-tight">
            Quer acompanhar as novidades?
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
            Salve os materiais que fizerem sentido e volte quando quiser continuar sua jornada.
          </p>
          <Button
            type="button"
            onClick={() => setLocation("/biblioteca")}
            className="pressable mt-6 rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"
          >
            Ir para a Biblioteca <ArrowRight size={14} className="ml-2" />
          </Button>
        </article>
      </section>
    </MemberShell>
  );
}
