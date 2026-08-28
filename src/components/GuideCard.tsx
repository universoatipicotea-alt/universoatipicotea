import type { PublicGuide } from "@/lib/guides.functions";

export function GuideCard({ guide }: { guide: PublicGuide }) {
  return (
    <article className="soft-card flex min-h-64 flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-6">
      <span
        className="text-[10px] font-extrabold uppercase tracking-[0.16em]"
        style={{ color: guide.accent_color || "var(--sage)" }}
      >
        {guide.category}
      </span>
      <h3 className="display-font mt-2 text-2xl font-semibold leading-tight text-[var(--ink)]">
        {guide.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-[var(--ink-soft)]">{guide.summary}</p>
      <div className="mt-5 flex items-center justify-between text-xs font-extrabold text-[var(--ink-soft)]">
        <span>{guide.page_count > 0 ? `${guide.page_count} páginas` : "Material digital"}</span>
        <span className="text-[var(--sage)]">{guide.has_pdf ? "PDF disponível" : "Em breve"}</span>
      </div>
    </article>
  );
}

export function EmptyGuides({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--line)] bg-white/70 p-10 text-center">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">{message}</p>
    </div>
  );
}
