import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { InstitutionalFooter } from "./InstitutionalFooter";
import { PublicHeader } from "./PublicHeader";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-texture min-h-screen overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <PublicHeader />
      <main>{children}</main>
      <footer className="border-t border-[var(--line)] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Brand compact />
            <p className="text-xs text-[var(--ink-soft)]">
              Universo Atípico · conteúdo com acolhimento e propósito.
            </p>
          </div>
          <InstitutionalFooter />
        </div>
      </footer>
    </div>
  );
}
