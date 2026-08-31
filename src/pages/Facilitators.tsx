import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Lightbulb, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export default function Facilitators() {
  const dashboard = trpc.community.memberDashboard.useQuery();
  const [filter, setFilter] = useState("Todos");

  const categoriesInUse = useMemo(
    () => ["Todos", ...Array.from(new Set<string>(dashboard.data?.facilitators.map(item => item.category) || []))],
    [dashboard.data?.facilitators],
  );
  const items = useMemo(
    () => (dashboard.data?.facilitators || []).filter(item => filter === "Todos" || item.category === filter),
    [dashboard.data?.facilitators, filter],
  );

  const eyebrow = "Facilitadores";
  const title = "Produtos e recursos que facilitam a rotina";
  const description =
    "Uma seleção editorial de produtos, materiais e recursos que podem facilitar a organização, o cuidado e os pequenos momentos do dia a dia.";

  if (dashboard.isLoading) {
    return (
      <MemberShell eyebrow={eyebrow} title={title} description={description}>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="h-64 animate-pulse rounded-3xl bg-[var(--linen)]" />
          ))}
        </div>
      </MemberShell>
    );
  }

  if (dashboard.isError) {
    return (
      <MemberShell eyebrow={eyebrow} title={title} description={description}>
        <ContentEmpty
          icon={Lightbulb}
          title="A seleção não abriu desta vez"
          text="Tente atualizar a página ou volte mais tarde."
        />
      </MemberShell>
    );
  }

  return (
    <MemberShell eyebrow={eyebrow} title={title} description={description}>
      <section className="rounded-3xl bg-[#ede7da] p-6 sm:p-8">
        <Sparkles size={20} className="text-[var(--clay)]" />
        <h2 className="display-font mt-5 max-w-2xl text-4xl font-semibold leading-[0.95]">Curadoria, não uma vitrine.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
          Cada recurso publicado explica com clareza por que faz sentido para quem vive a realidade atípica.
        </p>
      </section>

      <section className="mt-10">
        <SectionHeading label="Seleção da comunidade" title="Facilitadores publicados" />
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar facilitadores por categoria">
          {categoriesInUse.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              aria-pressed={filter === category}
              className={`pressable shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${filter === category ? "bg-[var(--sage-deep)] text-white" : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)] hover:bg-[var(--linen)]"}`}
            >
              {category}
            </button>
          ))}
        </div>
        {items.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map(item => (
              <article key={item.id} className="soft-card flex min-h-72 flex-col rounded-3xl p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--lavender)] text-[var(--sage-deep)]">
                  <Lightbulb size={19} />
                </span>
                <span className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage)]">
                  {item.category}
                </span>
                <h3 className="display-font mt-2 text-3xl font-semibold leading-none">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-[var(--ink-soft)]">{item.summary}</p>
                {item.linkUrl ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[var(--sage-deep)] hover:underline"
                  >
                    {item.sourceLabel || "Ver produto"}
                    <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <span className="mt-5 text-xs font-bold text-[var(--ink-soft)]">Recurso em breve</span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <ContentEmpty
              icon={Lightbulb}
              title="A seleção está sendo construída"
              text="Quando a administração publicar um recurso, ele aparecerá aqui com o contexto necessário."
            />
          </div>
        )}
      </section>
    </MemberShell>
  );
}
