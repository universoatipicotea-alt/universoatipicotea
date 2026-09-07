import { ArrowRight } from "lucide-react";
import { RecipeCover } from "./RecipeCover";

export type ContentCardProps = {
  title: string;
  category?: string | null;
  summary?: string | null;
  coverImageUrl?: string | null;
  accentColor?: string | null;
  ctaLabel: string;
  onClick?: () => void;
  progress?: { percent: number; currentPage: number; pageCount: number } | null;
  badge?: string | null;
  interactive?: boolean;
};

export function ContentCard({
  title,
  category,
  summary,
  coverImageUrl,
  accentColor,
  ctaLabel,
  onClick,
  progress,
  badge,
  interactive = true,
}: ContentCardProps) {
  const Wrapper = interactive && onClick ? "button" : "div";
  return (
    <Wrapper
      {...(interactive && onClick ? { type: "button" as const, onClick } : {})}
      className="interactive-card group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-left shadow-[0_10px_26px_rgba(8,31,77,.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
    >
      <div
        className="relative aspect-[16/9] overflow-hidden border-b border-[var(--line)]"
        style={{ backgroundColor: accentColor || "var(--linen)" }}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`Capa de ${title}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <RecipeCover title={title} accentColor={accentColor || "#0b2b26"} />
        )}
        {badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--ink)]/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {category ? (
          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage)]">
            {category}
          </span>
        ) : null}
        <h3 className="display-font mt-2 line-clamp-2 text-lg font-semibold leading-tight text-[var(--ink)] sm:text-xl">
          {title}
        </h3>
        {summary ? (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-[var(--ink-soft)]">
            {summary}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        {progress ? (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--linen)]">
              <div
                className="progress-shimmer h-full rounded-full bg-[var(--sage-deep)]"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-bold text-[var(--ink-soft)]">
              {progress.percent}% · página {progress.currentPage}
              {progress.pageCount ? ` de ${progress.pageCount}` : ""}
            </p>
          </div>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-2 border-t border-[var(--line)] pt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--sage-deep)]">
          {ctaLabel} <ArrowRight size={14} />
        </span>
      </div>
    </Wrapper>
  );
}

export function CardRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 xl:grid-cols-3">
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div key={index} className="w-[86%] shrink-0 snap-start sm:w-auto">
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
