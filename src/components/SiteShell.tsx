import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { InstitutionalFooter } from "./InstitutionalFooter";

const nav = [
  { to: "/", label: "Início" },
  { to: "/biblioteca", label: "Biblioteca" },
  { to: "/academia", label: "Academia Atípica" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-texture flex min-h-screen flex-col bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <Brand compact />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Navegação principal">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-extrabold text-[var(--ink)] transition hover:text-[var(--blue)]"
                activeProps={{ className: "text-sm font-extrabold text-[var(--blue)]" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/entrar"
            className="pressable inline-flex h-11 items-center rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-white transition hover:bg-[var(--blue)]"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <Brand compact />
            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--ink-soft)]">
              Conhecimento, recursos e comunidade para acompanhar cada jornada atípica.
            </p>
          </div>
          <nav className="flex flex-wrap gap-5 text-sm font-extrabold text-[var(--ink)]">
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className="hover:text-[var(--blue)]">
                {item.label}
              </Link>
            ))}
            <Link to="/entrar" className="hover:text-[var(--blue)]">
              Comunidade
            </Link>
          </nav>
        </div>
        <div className="mx-auto max-w-[1200px] px-5 pb-8 sm:px-8">
          <InstitutionalFooter />
        </div>
        <p className="border-t border-[var(--line)] px-5 py-5 text-center text-xs text-[var(--ink-soft)] sm:px-8">
          © {new Date().getFullYear()} Universo Atípico. Feito com cuidado.
        </p>
      </footer>
    </div>
  );
}
