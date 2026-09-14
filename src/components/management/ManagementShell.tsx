import { useAuth } from "@/_core/hooks/useAuth";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, LogOut, Menu, ShieldAlert, UsersRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { managementSections } from "./managementSections";

function isActive(location: string, href: string) {
  return location === href || location.startsWith(`${href}/`);
}

function ManagementGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-6">
        <div className="mx-auto h-24 max-w-7xl animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (!user || !["admin", "admin_master"].includes(user.accessRole)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] p-6 text-[#082c62]">
        <section className="w-full max-w-lg rounded-[2rem] border border-[#dfe6ee] bg-white p-8 text-center shadow-[0_24px_70px_rgba(8,31,77,.10)] sm:p-12">
          <ShieldAlert className="mx-auto text-[#e85e54]" size={32} />
          <h1 className="display-font mt-5 text-4xl font-semibold">Acesso administrativo</h1>
          <p className="mt-4 text-sm leading-7 text-[#60708a]">
            Esta área é exclusiva para contas administrativas autorizadas.
          </p>
          <Button asChild className="mt-7 min-h-12 rounded-xl bg-[#082c62] px-6 text-white">
            <Link href={user ? "/inicio" : "/entrar"}>{user ? "Voltar" : "Entrar"}</Link>
          </Button>
        </section>
      </main>
    );
  }

  return children;
}

export function ManagementShell({
  children,
  eyebrow,
  title,
  description,
  masterOnly = false,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  masterOnly?: boolean;
}) {
  return (
    <ManagementGate>
      <ManagementShellContent
        eyebrow={eyebrow}
        title={title}
        description={description}
        masterOnly={masterOnly}
      >
        {children}
      </ManagementShellContent>
    </ManagementGate>
  );
}

function ManagementShellContent({
  children,
  eyebrow,
  title,
  description,
  masterOnly,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  masterOnly: boolean;
}) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMaster = user?.accessRole === "admin_master";
  const sections = managementSections.filter((section) => isMaster || !section.masterOnly);

  if (masterOnly && !isMaster) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] p-6 text-[#082c62]">
        <section className="w-full max-w-lg rounded-[2rem] border border-[#dfe6ee] bg-white p-8 text-center shadow-[0_24px_70px_rgba(8,31,77,.10)]">
          <ShieldAlert className="mx-auto text-[#e85e54]" size={30} />
          <h1 className="display-font mt-5 text-3xl font-semibold">Área exclusiva do Master</h1>
          <p className="mt-3 text-sm leading-6 text-[#60708a]">
            Sua conta administrativa não possui autorização para esta configuração.
          </p>
          <Button asChild className="mt-6 rounded-xl bg-[#082c62] text-white">
            <Link href="/gestao">Voltar à gestão</Link>
          </Button>
        </section>
      </main>
    );
  }

  const leaveManagement = async () => {
    await logout();
    window.location.href = "/entrar";
  };

  const initials = (user?.name || "UA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navLinkClass = (active: boolean) =>
    `nav-link flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold ${
      active
        ? "bg-white text-[var(--sage-deep)] shadow-[0_8px_18px_rgba(8,31,77,.08)] ring-1 ring-[var(--line)]"
        : "text-[var(--ink-soft)] hover:bg-white/75 hover:text-[var(--ink)]"
    }`;

  const sidebarNav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1" aria-label="Áreas de gestão">
      <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
        Gestão
      </p>
      <Link
        href="/gestao"
        onClick={onNavigate}
        className={navLinkClass(location === "/gestao")}
        aria-current={location === "/gestao" ? "page" : undefined}
      >
        <Building2 size={18} strokeWidth={1.8} /> Visão geral
      </Link>
      {sections.map((section) => {
        const Icon = section.icon;
        const active = isActive(location, section.href);
        return (
          <div key={section.href}>
            <Link
              href={section.href}
              onClick={onNavigate}
              className={navLinkClass(active)}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} /> {section.shortLabel}
            </Link>
            {active ? (
              <div className="my-2 ml-5 space-y-1 border-l border-[var(--line)] pl-3">
                {section.destinations
                  .filter((destination) => isMaster || !destination.masterOnly)
                  .map((destination) => {
                    const DestinationIcon = destination.icon;
                    const destinationActive = location === destination.href;
                    return (
                      <Link
                        key={destination.href}
                        href={destination.href}
                        onClick={onNavigate}
                        className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
                          destinationActive
                            ? "bg-[var(--sage-pale)] text-[var(--sage-deep)]"
                            : "text-[var(--ink-soft)] hover:bg-white/75 hover:text-[var(--ink)]"
                        }`}
                      >
                        <DestinationIcon size={14} /> {destination.label}
                      </Link>
                    );
                  })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(251,249,245,0.92)] backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/gestao" className="max-w-[9.5rem] overflow-hidden">
            <Brand compact priority />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)] bg-white text-[var(--sage-deep)]"
            aria-label={mobileOpen ? "Fechar menu de gestão" : "Abrir menu de gestão"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen ? (
          <div className="border-t border-[var(--line)] bg-[#f7f4ee] px-4 py-4">
            {sidebarNav(() => setMobileOpen(false))}
          </div>
        ) : null}
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-[1760px]">
        <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col overflow-hidden border-r border-[var(--line)] bg-[#f7f4ee] p-4 lg:flex">
          <Link href="/gestao" className="min-w-0">
            <Brand compact priority />
          </Link>
          <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">{sidebarNav()}</div>
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--sage-pale)] text-xs font-extrabold text-[var(--sage-deep)]">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{user?.name || "Administração"}</p>
                <p className="truncate text-xs text-[var(--ink-soft)]">
                  {isMaster ? "Admin Master" : "Administrador"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void leaveManagement()}
                className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-[var(--linen)] hover:text-[var(--ink)]"
                aria-label="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
            <Link
              href="/inicio"
              className="mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] px-3 text-xs font-bold text-[var(--ink-soft)] hover:bg-[var(--linen)] hover:text-[var(--ink)]"
            >
              <ArrowLeft size={15} /> Visualizar como membro
            </Link>
          </div>
        </aside>

        <main className="page-texture min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1500px] px-5 pb-24 pt-7 sm:px-8 lg:px-12 lg:py-9">
            <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                Centro de gestão
              </p>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--sage-pale)] px-3 py-2 text-xs font-extrabold text-[var(--sage-deep)]">
                <UsersRound size={15} /> {isMaster ? "Admin Master" : "Administrador"}
              </span>
            </div>
            <header className="mb-9 border-b border-[var(--line)] pb-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">
                {eyebrow}
              </p>
              <h1 className="display-font mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
                {description}
              </p>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
