import { useAuth } from "@/_core/hooks/useAuth";
import heroAsset from "@/assets/universo-atipico-hero.png.asset.json";
import { Brand } from "@/components/Brand";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
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

  const ctaLabel = funnel.data?.ctaLabel ?? "Começar agora";
  const priceLabel = funnel.data?.priceLabel ?? "R$ 49,90";

  const benefits = [
    [BookOpen, "Conhecimento organizado", "Guias, materiais e jornadas por tema para apoiar decisões do dia a dia."],
    [MessageCircleMore, "Pessoas e trocas", "Um espaço para perguntas, experiências e escuta respeitosa entre famílias."],
    [ShieldCheck, "Recursos e soluções", "Caminhos práticos e recomendações selecionadas para a vida real."],
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
          <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:min-h-[680px] lg:grid-cols-[minmax(0,1fr)_minmax(0,.95fr)] lg:px-12 lg:py-20">
            <div className="relative z-10 flex flex-col justify-center">
              <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
                <Sparkles size={13} /> Universo Atípico · acesso por assinatura
              </div>
              <h1 className="display-font max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.4rem]">
                Um lugar para <em className="font-semibold not-italic text-[#efd4a2]">respirar</em>, aprender e seguir em companhia.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
                Conhecimento, recursos e comunidade para acompanhar cada jornada atípica. Um ecossistema de
                experiências, pessoas e soluções para quem vive a realidade atípica.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <Button
                  onClick={() => setLocation("/vsl")}
                  className="pressable h-14 min-w-[240px] rounded-xl bg-[#efd4a2] px-8 text-base font-extrabold uppercase tracking-[0.08em] text-[var(--ink)] shadow-[0_12px_24px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_30px_rgba(0,0,0,.22)]"
                >
                  {ctaLabel} <ArrowRight className="ml-3" size={19} />
                </Button>
              </div>
              <p className="mt-5 text-xs font-medium text-white/60">
                {priceLabel}/mês · acesso completo ao Universo Atípico. Cancele quando quiser.
              </p>
            </div>
            <div className="relative">
              <img
                src={heroAsset.url}
                alt="Mãe e criança lendo um livro juntos em um sofá, em um ambiente acolhedor e iluminado"
                className="w-full rounded-[2rem] object-cover shadow-[0_30px_70px_rgba(0,0,0,.35)] lg:aspect-[4/3]"
                loading="eager"
              />
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
              Um ecossistema que caminha com a sua família.
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
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              onClick={() => setLocation("/vsl")}
              className="pressable h-14 rounded-xl bg-[var(--sage-deep)] px-8 text-base font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_12px_24px_rgba(34,91,73,.18)] transition hover:-translate-y-0.5 hover:bg-[var(--ink)] hover:shadow-[0_16px_30px_rgba(34,91,73,.22)]"
            >
              {ctaLabel} <ArrowRight className="ml-3" size={19} />
            </Button>
            <p className="text-xs font-medium text-[var(--ink-soft)]">
              {priceLabel}/mês · assinatura ativa = acesso ao Universo Atípico.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-white px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <Brand compact />
            <p className="text-xs text-[var(--ink-soft)]">
              Universo Atípico. Conhecimento, experiências, pessoas e soluções para a realidade atípica.
            </p>
          </div>
          <InstitutionalFooter />
        </div>
      </footer>
    </div>
  );
}
