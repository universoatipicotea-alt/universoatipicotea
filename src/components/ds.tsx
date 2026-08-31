/**
 * Design System do Universo Atípico.
 *
 * Fonte de verdade visual: Gestão → Administração → Receitas.
 * Toda nova tela deve reaproveitar estes componentes antes de criar estilos próprios.
 */
import type { ComponentProps, ReactNode } from "react";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ---------------------------------- tokens --------------------------------- */

export const ds = {
  surface: "rounded-2xl border border-[var(--line)] bg-white",
  surfaceSoft: "rounded-2xl border border-dashed border-[var(--line)] bg-white",
  input:
    "h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage)]/20",
  select: "h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--sage)]",
  primary:
    "pressable inline-flex items-center justify-center rounded-xl bg-[var(--sage-deep)] px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[var(--ink)] disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[var(--sage-deep)] transition hover:bg-[var(--linen)]",
  danger:
    "inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[#9c583c] transition hover:bg-[#fdf3ee]",
  microLabel: "text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]",
  meta: "text-xs font-bold text-[var(--ink-soft)]",
} as const;

export function chipClass(active: boolean) {
  return `pressable shrink-0 rounded-full px-3.5 py-2 text-xs font-extrabold transition ${
    active
      ? "bg-[var(--sage-deep)] text-white"
      : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)] hover:bg-[var(--linen)]"
  }`;
}

/* --------------------------------- estrutura -------------------------------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  counter,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  counter?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className={ds.microLabel}>{eyebrow}</p>
        <h2 className="display-font mt-2 text-3xl font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p> : null}
        {counter ? <p className={`mt-1 ${ds.meta}`}>{counter}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ label, title, action }: { label: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className={ds.microLabel}>{label}</p>
        <h2 className="display-font mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Barra de filtros padrão (mesma da tela de Receitas na Administração). */
export function Toolbar({ children, columns = "md:grid-cols-[1.4fr_1fr_1fr_1fr]" }: { children: ReactNode; columns?: string }) {
  return <div className={`grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 ${columns}`}>{children}</div>;
}

export function SearchField({
  value,
  onChange,
  placeholder = "Buscar",
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={15} />
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`${ds.input} pl-9`}
      />
    </label>
  );
}

export function SelectField({ label, className = "", ...props }: ComponentProps<"select"> & { label: string }) {
  return <select aria-label={label} className={`${ds.select} ${className}`} {...props} />;
}

export function ChipFilter({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={label}>
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
          className={chipClass(value === option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- estados ---------------------------------- */

export type ContentStatus = "draft" | "published" | "archived";

const statusMeta: Record<ContentStatus, { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-[var(--sage-pale)] text-[var(--sage-deep)]" },
  draft: { label: "Rascunho", className: "bg-[var(--lavender)] text-[#665d81]" },
  archived: { label: "Arquivado", className: "bg-[#f5e7df] text-[#9c583c]" },
};

export function StatusPill({ status }: { status: ContentStatus }) {
  const meta = statusMeta[status] ?? statusMeta.draft;
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function Badge({ children, tone = "sage" }: { children: ReactNode; tone?: "sage" | "neutral" | "ink" }) {
  const tones = {
    sage: "bg-[var(--sage-pale)] text-[var(--sage-deep)]",
    neutral: "bg-[var(--linen)] text-[var(--ink-soft)]",
    ink: "bg-[var(--ink)]/90 text-white",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-10 text-center">
      <Icon size={22} className="mx-auto text-[var(--sage)]" />
      <p className="display-font mt-3 text-2xl font-semibold">{title}</p>
      {text ? <p className="mt-1 text-sm text-[var(--ink-soft)]">{text}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ text = "Não foi possível carregar estas informações agora." }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--ink-soft)]">
      {text}
    </div>
  );
}

export function SkeletonList({ rows = 3, height = "h-24" }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={`${height} animate-pulse rounded-2xl bg-[var(--linen)]`} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 3, className = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", height = "h-72" }) {
  return (
    <div className={className}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={`${height} animate-pulse rounded-2xl bg-[var(--linen)]`} />
      ))}
    </div>
  );
}

/* ---------------------------------- cards ----------------------------------- */

export function Card({ children, className = "", as: Tag = "article" }: { children: ReactNode; className?: string; as?: any }) {
  return (
    <Tag
      className={`rounded-2xl border border-[var(--line)] bg-white shadow-[0_10px_28px_rgba(8,31,77,.04)] transition hover:shadow-[0_18px_38px_rgba(8,31,77,.08)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6 ${className}`}>{children}</section>;
}

/** Linha de listagem operacional: thumbnail + metadados + ações. */
export function ListRow({ media, children, actions }: { media?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <article className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4">
      {media ? <div className="grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--linen)] p-1">{media}</div> : null}
      <div className="min-w-[200px] flex-1">{children}</div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}
