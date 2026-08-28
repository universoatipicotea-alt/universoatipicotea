import { useAuth } from "@/_core/hooks/useAuth";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";

function Metric({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div className="border-l border-white/30 pl-5 first:border-l-0 first:pl-0">
      <strong className="display-font block text-3xl font-semibold text-white">{value ?? 0}</strong>
      <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/70">{label}</span>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const landing = trpc.community.landing.useQuery();
  const funnel = trpc.community.funnel.get.useQuery();
  const [, setLocation] = useLocation();
  const data = landing.data;

  const ctaLabel = funnel.data?.ctaLabel ?? "Quero fazer parte da comunidade";
  const priceLabel = funnel.data?.priceLabel ?? "R$ 49,90";

  const benefits = [
    [BookOpen, "Materiais organizados", "Guias e recursos por tema para apoiar decisões do dia a dia."],
    [MessageCircleMore, "Conversas cuidadosas", "Um espaço para perguntas, trocas e escuta respeitosa."],
    [ShieldCheck, "Ambiente seguro", "Comunidade moderada e pensada para acolher cada família."],
  ] as const;

  return (
    <div className="page-texture min-h-screen overflow-hidden bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Brand />
          <Link
            href={isAuthenticated ? "/comunidade" : "/entrar"}
            className="text-sm font-extrabold text-[var(--ink)] hover:text-[var(--blue)]"
          >
            {isAuthenticated ? "Acessar" : "Entrar"}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[var(--ink)]">
          <div className="mx-auto grid max-w-[1440px] items-stretch lg:min-h-[680px] lg:grid-cols-2">
            <div className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
              <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
                <Sparkles size={13} /> Comunidade paga · Acesso imediato
              </div>
              <h1 className="display-font max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.4rem]">
                Um lugar para <em className="font-semibold not-italic text-[#efd4a2]">respirar</em>, aprender e seguir em companhia.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
                Apoio, conhecimento e comunidade para cada jornada atípica. Entre por uma taxa única e tenha acesso completo.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <Button
                  onClick={() => setLocation("/vsl")}
                  className="pressable h-14 min-w-[260px] rounded-xl bg-[#efd4a2] px-8 text-base font-extrabold text-[var(--ink)] shadow-[0_12px_24px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_30px_rgba(0,0,0,.22)]"
                >
                  {ctaLabel} <ArrowRight className="ml-3" size={19} />
                </Button>
              </div>
              <p className="mt-5 text-xs font-medium text-white/55">
                {priceLabel} · Acesso contínuo à comunidade e materiais.
              </p>
            </div>
            <div className="relative min-h-[420px] overflow-hidden lg:min-h-0">
              <img
                src="/manus-storage/hero-cozinha-editorial_35130c6e.png"
                alt="Mãe e criança preparando uma receita em uma cozinha acolhedora com um notebook aberto"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/40 via-transparent to-transparent" />
            </div>
          </div>
        </section>

        <section className="bg-[var(--ink)] border-t border-white/10">
          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-4 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
            <Metric value={data?.metrics.members} label="membros" />
            <Metric value={data?.metrics.guides} label="guias publicados" />
            <Metric value={data?.metrics.topics} label="conversas abertas" />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
          <div className="text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--blue)]">O que você encontra dentro</p>
            <h2 className="display-font mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-[var(--ink)]">
              Uma comunidade que cresce com cuidado.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map(([Icon, title, text]) => (
              <article key={title} className="soft-card rounded-3xl p-7">
                <Icon size={22} className="text-[var(--sage-deep)]" />
                <h3 className="display-font mt-6 text-xl font-semibold text-[var(--ink)]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button
              onClick={() => setLocation("/vsl")}
              className="pressable h-14 rounded-xl bg-[var(--sage-deep)] px-8 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(34,91,73,.18)] transition hover:-translate-y-0.5 hover:bg-[var(--ink)] hover:shadow-[0_16px_30px_rgba(34,91,73,.22)]"
            >
              {ctaLabel} <ArrowRight className="ml-3" size={19} />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <Brand compact />
          <p className="text-xs text-[var(--ink-soft)]">Universo Atípico. Comunidade e conhecimento para jornadas atípicas.</p>
        </div>
      </footer>
    </div>
  );
}
