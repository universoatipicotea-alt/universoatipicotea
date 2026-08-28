import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { InstitutionalFooter } from "./InstitutionalFooter";

export function LegalLayout({
  eyebrow,
  title,
  intro,
  updatedAt = "28 de agosto de 2026",
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <div className="page-texture flex min-h-screen flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Brand compact />
          <Link
            to="/checkout"
            className="pressable inline-flex h-10 items-center rounded-xl bg-[var(--sage-deep)] px-4 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
          >
            Começar agora
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] flex-1 px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage-deep)]">
          {eyebrow}
        </p>
        <h1 className="display-font mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-8 text-[var(--ink-soft)]">{intro}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Última atualização: {updatedAt}
        </p>
        <div className="legal-body mt-10 space-y-8">{children}</div>
      </main>

      <footer className="border-t border-[var(--line)] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-[1100px]">
          <InstitutionalFooter />
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="display-font text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--ink-soft)]">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sage)]"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
