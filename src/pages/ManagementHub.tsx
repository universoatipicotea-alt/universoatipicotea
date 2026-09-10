import { ManagementShell } from "@/components/management/ManagementShell";
import { managementSections } from "@/components/management/managementSections";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ManagementHub() {
  const { user } = useAuth();
  const isMaster = user?.accessRole === "admin_master";
  const visibleSections = managementSections.filter((section) => isMaster || !section.masterOnly);

  return (
    <ManagementShell
      eyebrow="Visão geral"
      title="Operação organizada para crescer."
      description="Escolha uma área de trabalho. Cada setor reúne as ferramentas relacionadas e mantém a gestão separada da experiência dos assinantes."
    >
      <section className="grid gap-4 md:grid-cols-2">
        {visibleSections.map((section, index) => {
          const Icon = section.icon;
          const accents = ["#e8f2ff", "#edf8f2", "#fff5dc", "#fff0ed"];
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group relative min-h-64 overflow-hidden rounded-[2rem] border border-[#dfe6ee] bg-white p-6 shadow-[0_16px_42px_rgba(8,31,77,.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(8,31,77,.11)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/30 sm:p-8"
            >
              <span
                className="absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-80 transition group-hover:scale-110"
                style={{ backgroundColor: accents[index] }}
                aria-hidden="true"
              />
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-[#082c62] text-white">
                <Icon size={22} />
              </span>
              <h2 className="display-font relative mt-7 text-3xl font-semibold tracking-[-.03em]">
                {section.label}
              </h2>
              <p className="relative mt-3 max-w-md text-sm leading-6 text-[#60708a]">
                {section.description}
              </p>
              <span className="relative mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#082c62]">
                Abrir área <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="mt-7 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-3xl bg-[#082c62] p-6 text-white sm:p-8">
          <Sparkles className="text-[#f4c96b]" size={21} />
          <h2 className="display-font mt-5 text-3xl font-semibold">Fundação do novo backoffice</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            As ferramentas existentes continuam disponíveis enquanto conteúdo, comunidade, comercial
            e plataforma passam a ter responsabilidades claramente separadas.
          </p>
        </article>
        <article className="rounded-3xl border border-[#dfe6ee] bg-white p-6 sm:p-8">
          <ShieldCheck className="text-[#2f8f68]" size={21} />
          <h2 className="mt-5 text-lg font-extrabold">Operação protegida</h2>
          <ul className="mt-4 space-y-3 text-sm text-[#60708a]">
            <li className="flex gap-2">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#2f8f68]" /> Acesso validado
              por papel
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#2f8f68]" /> Área de membros
              separada
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#2f8f68]" /> Nenhuma cobrança
              alterada
            </li>
          </ul>
        </article>
      </section>
    </ManagementShell>
  );
}
