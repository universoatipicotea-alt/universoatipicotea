import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/Brand";
import type { CamilaLinkEvent } from "@/config/camilaPublicLinks";
import { emitCamilaLinkEvent } from "@/lib/publicLinkEvents";

const accentClasses = {
  coral: { bar: "bg-[#ff6657]", surface: "bg-[#fff9f6]" },
  green: { bar: "bg-[#49ac7d]", surface: "bg-[#f4fbf7]" },
  blue: { bar: "bg-[#3a9fd6]", surface: "bg-[#f4f9fd]" },
  yellow: { bar: "bg-[#f5b83e]", surface: "bg-[#fffbf2]" },
};

type PublicLinkCardProps = {
  title: string;
  description: string;
  href: string;
  event: CamilaLinkEvent;
  accent: keyof typeof accentClasses;
  brand: "universo" | "pending";
};

export function PublicLinkCard({
  title,
  description,
  href,
  event,
  accent,
  brand,
}: PublicLinkCardProps) {
  const colors = accentClasses[accent];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-event={event}
      onClick={() => emitCamilaLinkEvent(event)}
      className={`group relative grid min-h-32 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 overflow-hidden rounded-3xl border border-[#dfe6ee] p-5 shadow-[0_12px_30px_rgba(8,31,77,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(8,31,77,.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/35 active:scale-[.99] sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:p-6 ${colors.surface}`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${colors.bar}`} />

      <span className="col-span-2 flex min-h-10 items-center pl-1 sm:col-span-1">
        {brand === "universo" ? (
          <Brand compact />
        ) : (
          <span className="inline-flex rounded-full border border-dashed border-[#9bacbf] bg-white/70 px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#6b7d93]">
            Logo pendente
          </span>
        )}
      </span>

      <span className="min-w-0 pl-1">
        <strong className="display-font block text-xl font-semibold text-[#082c62] sm:text-2xl">
          {title}
        </strong>
        <span className="mt-1.5 block text-sm leading-6 text-[#52647d]">{description}</span>
      </span>

      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-[#082c62] shadow-sm transition group-hover:bg-[#082c62] group-hover:text-white">
        <ArrowUpRight size={20} />
      </span>
    </a>
  );
}
