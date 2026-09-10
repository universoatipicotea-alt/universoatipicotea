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

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#082c62]">
      <header className="sticky top-0 z-40 border-b border-[#dfe6ee] bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/gestao" className="max-w-[9.5rem] overflow-hidden">
            <Brand compact priority />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#dfe6ee] bg-white"
            aria-label={mobileOpen ? "Fechar menu de gestão" : "Abrir menu de gestão"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen ? (
          <nav className="border-t border-[#dfe6ee] px-4 py-4" aria-label="Áreas de gestão">
            <Link
              href="/gestao"
              onClick={() => setMobileOpen(false)}
              className="mb-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-extrabold"
            >
              <Building2 size={18} /> Visão geral
            </Link>
            {sections.map((section) => {
              const Icon = section.icon;
              const active = isActive(location, section.href);
              return (
                <div key={section.href}>
                  <Link
                    href={section.href}
                    onClick={() => setMobileOpen(false)}
                    className={`mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold ${active ? "bg-[#e8f2ff] text-[#082c62]" : "text-[#60708a]"}`}
                  >
                    <Icon size={18} /> {section.label}
                  </Link>
                  {active ? (
                    <div className="mb-3 ml-5 border-l border-[#cdd8e6] pl-3">
                      {section.destinations
                        .filter((destination) => isMaster || !destination.masterOnly)
                        .map((destination) => (
                          <Link
                            key={destination.href}
                            href={destination.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex min-h-10 items-center rounded-lg px-3 text-xs font-bold ${location === destination.href ? "bg-[#082c62] text-white" : "text-[#60708a]"}`}
                          >
                            {destination.label}
                          </Link>
                        ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        ) : null}
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-[1920px]">
        <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col border-r border-[#dfe6ee] bg-[#071f4d] px-5 py-6 text-white lg:flex">
          <Link href="/gestao" className="rounded-2xl bg-white p-3">
            <Brand compact priority />
          </Link>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f4c96b]">
              Backoffice
            </p>
            <p className="mt-2 font-extrabold">Universo Atípico</p>
            <p className="mt-1 text-xs leading-5 text-white/60">
              Operação, conteúdo, clientes e crescimento em um só lugar.
            </p>
          </div>
          <nav
            className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto"
            aria-label="Áreas de gestão"
          >
            <Link
              href="/gestao"
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-extrabold ${location === "/gestao" ? "bg-white text-[#082c62]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
            >
              <Building2 size={18} /> Visão geral
            </Link>
            {sections.map((section) => {
              const Icon = section.icon;
              const active = isActive(location, section.href);
              return (
                <div key={section.href}>
                  <Link
                    href={section.href}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-white text-[#082c62]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon size={18} /> {section.shortLabel}
                  </Link>
                  {active ? (
                    <div className="my-2 ml-5 space-y-1 border-l border-white/15 pl-3">
                      {section.destinations
                        .filter((destination) => isMaster || !destination.masterOnly)
                        .map((destination) => {
                          const DestinationIcon = destination.icon;
                          const destinationActive = location === destination.href;
                          return (
                            <Link
                              key={destination.href}
                              href={destination.href}
                              className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold transition ${destinationActive ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10 hover:text-white"}`}
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
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="truncate text-sm font-extrabold">{user?.name || "Administração"}</p>
            <p className="mt-1 text-xs text-white/55">
              {isMaster ? "Admin Master" : "Administrador"}
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                href="/inicio"
                className="flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-bold text-white/75 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft size={15} /> Visualizar como membro
              </Link>
              <button
                type="button"
                onClick={() => void leaveManagement()}
                className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={15} /> Sair
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1480px] px-4 pb-16 pt-6 sm:px-7 lg:px-10 lg:py-9 xl:px-12">
            <div className="mb-7 flex flex-col gap-4 rounded-3xl border border-[#dfe6ee] bg-white px-5 py-5 shadow-[0_14px_40px_rgba(8,31,77,.06)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#2f8f68]">
                  Centro de gestão
                </p>
                <p className="mt-1 text-sm font-bold text-[#60708a]">
                  Ambiente administrativo separado da área dos membros
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef5ff] px-3 py-2 text-xs font-extrabold">
                <UsersRound size={15} /> {isMaster ? "Admin Master" : "Administrador"}
              </div>
            </div>
            <header className="mb-9 border-b border-[#dfe6ee] pb-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#2f8f68]">
                {eyebrow}
              </p>
              <h1 className="display-font mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#60708a]">{description}</p>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
