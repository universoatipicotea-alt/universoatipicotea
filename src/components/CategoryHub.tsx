import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export type HubItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
};

export function CategoryHub({
  items,
  basePath,
  countFor,
  emptyLabel,
}: {
  items: HubItem[];
  basePath: string;
  countFor: (slug: string) => number;
  emptyLabel: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const total = countFor(item.slug);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setLocation(`${basePath}/${item.slug}`)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-left shadow-[0_10px_28px_rgba(8,31,77,.04)] transition hover:shadow-[0_18px_38px_rgba(8,31,77,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[var(--line)] bg-[var(--linen)]">
              {item.coverImageUrl ? (
                <img
                  src={item.coverImageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid h-full w-full place-items-center px-6 text-center">
                  <span className="display-font text-2xl font-semibold leading-tight text-[var(--ink)]">
                    {item.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="display-font text-2xl font-semibold leading-tight">{item.name}</h3>
              {item.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {item.description}
                </p>
              ) : null}
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-[var(--sage-deep)]">
                {total > 0 ? `${total} ${total === 1 ? emptyLabel.replace(/s$/, "") : emptyLabel}` : "Em breve"}
                <ArrowRight size={14} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryHub;
