import { ArrowRight, LockKeyhole } from "lucide-react";
import { useLocation } from "wouter";

export type HubItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  status?: "draft" | "published" | "coming_soon" | "archived";
  comingSoonMessage?: string | null;
};

export function CategoryHub({
  items,
  basePath,
  countFor,
  emptyLabel,
  coverFor,
  compactMobile = false,
  actionLabel = "Abrir",
}: {
  items: HubItem[];
  basePath: string;
  countFor: (slug: string) => number;
  emptyLabel: string;
  coverFor?: (item: HubItem, index: number) => string | null;
  compactMobile?: boolean;
  actionLabel?: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const total = countFor(item.slug);
        const comingSoon = item.status === "coming_soon";
        const cover = coverFor?.(item, index) || item.coverImageUrl;
        const body = (
          <>
            <div className="relative aspect-[64/45] w-full overflow-hidden border-b border-[var(--line)] bg-[var(--academy-cream)]">
              {cover ? (
                <img
                  src={cover}
                  alt={`Capa do módulo ${item.name}`}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1279px) 50vw, 33vw"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full w-full place-items-center px-6 text-center">
                  <span className="display-font text-2xl font-semibold leading-tight text-[var(--ink)]">
                    {item.name}
                  </span>
                </div>
              )}
              {comingSoon ? (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                  <LockKeyhole size={13} /> Em breve
                </span>
              ) : null}
            </div>
            <div className={`flex flex-1 flex-col ${compactMobile ? "p-4 sm:p-5" : "p-5"}`}>
              <div className="mb-3 flex gap-1.5" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
              </div>
              <h3 className="display-font text-xl font-semibold leading-tight sm:text-2xl">{item.name}</h3>
              {item.description ? (
                <p className={`${compactMobile ? "hidden sm:line-clamp-2" : "line-clamp-2"} mt-2 text-sm leading-6 text-[var(--ink-soft)]`}>
                  {item.description}
                </p>
              ) : null}
              {comingSoon ? (
                <p className="mt-4 text-xs font-semibold leading-5 text-[var(--ink-soft)]">
                  {item.comingSoonMessage ||
                    "Estamos preparando este módulo com cuidado. Em breve, novos conteúdos estarão disponíveis para você."}
                </p>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[var(--ink-soft)]">
                    {total > 0
                      ? `${total} ${total === 1 ? emptyLabel.replace(/s$/, "") : emptyLabel}`
                      : "Em preparação"}
                  </span>
                  <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--sage-deep)] px-3 text-xs font-extrabold text-[var(--primary-foreground)]">
                    {actionLabel} <ArrowRight size={14} />
                  </span>
                </div>
              )}
            </div>
          </>
        );
        return comingSoon ? (
          <article
            key={item.id}
            aria-label={`${item.name}: em breve`}
            aria-disabled="true"
            className="flex cursor-not-allowed flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] text-left opacity-95 shadow-sm"
          >
            {body}
          </article>
        ) : (
          <button
            key={item.id}
            type="button"
            onClick={() => setLocation(`${basePath}/${item.slug}`)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] text-left shadow-sm transition hover:border-[var(--sage)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryHub;
