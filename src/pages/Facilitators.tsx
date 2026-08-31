import { ContentEmpty, MemberShell } from "@/components/MemberShell";
import { Badge, ChipFilter, SectionTitle, SkeletonGrid } from "@/components/ds";
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
        <SkeletonGrid items={3} height="h-64" />
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

      <section>
        <SectionTitle label="Seleção da comunidade" title="Facilitadores publicados" />
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <ChipFilter
            label="Filtrar facilitadores por categoria"
            value={filter}
            onChange={setFilter}
            options={categoriesInUse.map(category => ({ key: category, label: category }))}
          />
        </div>
        {items.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map(item => (
              <article key={item.id} className="flex min-h-72 flex-col rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_10px_28px_rgba(8,31,77,.04)] transition hover:shadow-[0_18px_38px_rgba(8,31,77,.08)]">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--lavender)] text-[var(--sage-deep)]">
                  <Lightbulb size={19} />
                </span>
                <div className="mt-6"><Badge>{item.category}</Badge></div>
                <h3 className="display-font mt-3 text-2xl font-semibold leading-tight">{item.title}</h3>
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
