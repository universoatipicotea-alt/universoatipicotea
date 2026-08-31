import heroAsset from "@/assets/universo-atipico-hero.png.asset.json";
import { Brand } from "@/components/Brand";
import { PublicHeader } from "@/components/PublicHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChefHat,
  MessageCircleMore,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";

type PreviewItem = {
  id: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  coverImageUrl?: string | null;
};

const FAQ = [
  {
    q: "Como funciona a assinatura?",
    a: "É um acesso mensal de R$ 49,90. Você assina, cria sua conta logo após a confirmação do pagamento e entra na plataforma completa no mesmo dia.",
  },
  {
    q: "Preciso criar conta antes de assinar?",
    a: "Não. A conta é criada depois do pagamento confirmado, com o e-mail usado na compra. Isso deixa o acesso mais simples e seguro.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O cancelamento é feito em Minha assinatura, sem burocracia. O acesso segue ativo até o fim do período já pago.",
  },
  {
    q: "O conteúdo substitui acompanhamento profissional?",
    a: "Não. O Universo Atípico é conteúdo informativo e de apoio à rotina. Ele caminha junto com as orientações da equipe que acompanha sua família.",
  },
  {
    q: "O que entra no acesso?",
    a: "Academia Atípica (guias e materiais), receitas, vídeos, biblioteca, comunidade e as novidades publicadas ao longo dos meses.",
  },
];

function PreviewCard({ item, badge }: { item: PreviewItem; badge: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_10px_30px_-22px_rgba(8,31,77,.5)]">
      <div className="grid aspect-[3/4] place-items-center overflow-hidden bg-[var(--linen)]">
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt={`Capa de ${item.title}`}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <BookOpen size={26} className="text-[var(--sage-deep)]" />
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">
          {item.category || badge}
        </p>
        <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-5 text-[var(--ink)]">{item.title}</h3>
      </div>
    </article>
  );
}

export default function Home() {
  const landing = trpc.community.landing.useQuery();
  const funnel = trpc.community.funnel.get.useQuery();
  const [, setLocation] = useLocation();
  const data = landing.data;

  const ctaLabel = funnel.data?.ctaLabel ?? "Começar agora";
  const priceLabel = funnel.data?.priceLabel ?? "R$ 49,90";
  const guides: PreviewItem[] = data?.preview?.guides ?? [];
  const recipes: PreviewItem[] = data?.preview?.recipes ?? [];

  const goCheckout = () => setLocation("/checkout");

  const pillars = [
    [BookOpen, "Academia Atípica", "Guias e materiais organizados por tema para apoiar decisões do dia a dia."],
    [ChefHat, "Receitas", "Ideias práticas para a alimentação real, com seletividade e rotina em mente."],
    [PlayCircle, "Vídeos e biblioteca", "Conteúdos curtos e materiais para consultar quando precisar."],
    [MessageCircleMore, "Comunidade", "Um espaço de escuta e troca entre famílias que vivem a mesma realidade."],
  ] as const;

  return (
    <div className="page-texture min-h-screen overflow-hidden bg-[var(--paper)]">
      <PublicHeader />

      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-[var(--ink)]">
          <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:min-h-[640px] lg:grid-cols-[minmax(0,1fr)_minmax(0,.95fr)] lg:px-12 lg:py-20">
            <div className="relative z-10 flex flex-col justify-center">
              <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
                <Sparkles size={13} /> Universo Atípico · acesso por assinatura
              </div>
              <h1 className="display-font max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.4rem]">
                Informação, recursos e companhia para a <em className="font-semibold not-italic text-[#efd4a2]">rotina real</em>.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
                Uma assinatura única com guias, receitas, vídeos, biblioteca e comunidade para famílias atípicas —
                tudo em um só lugar, sem cursos avulsos e sem promessas milagrosas.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={goCheckout}
                  className="pressable h-14 min-w-[240px] rounded-xl bg-[#efd4a2] px-8 text-base font-extrabold uppercase tracking-[0.08em] text-[var(--ink)] shadow-[0_12px_24px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {ctaLabel} <ArrowRight className="ml-3" size={19} />
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-14 rounded-xl border-white/30 bg-transparent px-6 text-sm font-extrabold text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/vsl">Assistir apresentação</Link>
                </Button>
              </div>
              <p className="mt-5 text-xs font-medium text-white/60">
                {priceLabel}/mês · acesso completo. Cancele quando quiser.
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

        {/* SOBRE */}
        <section id="sobre" className="scroll-mt-24 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:px-12 lg:py-20">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">Sobre o Universo</p>
              <h2 className="display-font mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--ink)]">
                Feito por quem vive a rotina atípica.
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-[var(--ink-soft)]">
              <p>
                O Universo Atípico nasceu para reunir, em um lugar só, o que costuma estar espalhado: informação
                confiável, materiais práticos e pessoas que entendem o dia a dia de uma família atípica.
              </p>
              <p>
                Não vendemos cursos soltos nem prometemos soluções rápidas. Oferecemos um acesso contínuo, com
                conteúdo novo publicado ao longo do tempo e uma comunidade para caminhar junto.
              </p>
              <ul className="grid gap-2 pt-2">
                {["Assinatura única, sem venda de módulos avulsos", "Conteúdo publicado e atualizado pela equipe", "Comunidade moderada e respeitosa"].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm font-semibold text-[var(--ink)]">
                    <Check size={16} className="mt-0.5 shrink-0 text-[var(--sage-deep)]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* O QUE VOCÊ ENCONTRA */}
        <section id="o-que-encontra" className="scroll-mt-24">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">O que você encontra</p>
              <h2 className="display-font mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-[var(--ink)]">
                Tudo incluído na mesma assinatura.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map(([Icon, title, text]) => (
                <article key={title} className="rounded-2xl border border-[var(--line)] bg-white p-6">
                  <Icon size={22} className="text-[var(--sage-deep)]" />
                  <h3 className="display-font mt-5 text-xl font-semibold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>
                </article>
              ))}
            </div>

            {guides.length ? (
              <div className="mt-14">
                <h3 className="display-font text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Materiais já publicados na Academia Atípica
                </h3>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {guides.slice(0, 6).map(item => (
                    <PreviewCard key={item.id} item={item} badge="Guia" />
                  ))}
                </div>
              </div>
            ) : null}

            {recipes.length ? (
              <div className="mt-12">
                <h3 className="display-font text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Receitas para a alimentação real
                </h3>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {recipes.slice(0, 6).map(item => (
                    <PreviewCard key={item.id} item={item} badge="Receita" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* COMUNIDADE */}
        <section id="comunidade" className="scroll-mt-24 bg-[var(--linen)]">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:py-20">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">Comunidade</p>
              <h2 className="display-font mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--ink)]">
                Você não precisa atravessar isso sozinha.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
                Um espaço para perguntar, contar como foi o dia e ler experiências de quem entende. Sem julgamento,
                com moderação e cuidado com a privacidade de cada família.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  [Users, data?.metrics.members ?? 0, "membros"],
                  [BookOpen, data?.metrics.guides ?? 0, "materiais"],
                  [MessageCircleMore, data?.metrics.topics ?? 0, "conversas"],
                ].map(([Icon, value, label]: any) => (
                  <div key={label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                    <Icon size={18} className="text-[var(--sage-deep)]" />
                    <strong className="display-font mt-3 block text-2xl font-semibold text-[var(--ink)]">{value}</strong>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink-soft)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-white p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">Como funciona</p>
              <ol className="mt-5 space-y-5">
                {[
                  ["Assine por R$ 49,90/mês", "Pagamento seguro, em poucos cliques."],
                  ["Crie sua conta", "Logo após a confirmação, com o e-mail da compra."],
                  ["Acesse tudo", "Academia, receitas, vídeos, biblioteca e comunidade."],
                ].map(([title, text], index) => (
                  <li key={title} className="flex gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--sage-pale)] text-sm font-extrabold text-[var(--sage-deep)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--ink)]">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ASSINATURA */}
        <section id="assinatura" className="scroll-mt-24">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-20">
            <div className="rounded-[2rem] border border-[var(--line)] bg-white p-7 text-center shadow-[0_24px_60px_rgba(8,31,77,.08)] sm:p-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">Plano Universo</p>
              <p className="display-font mt-4 text-5xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {priceLabel}
                <span className="text-base font-bold text-[var(--ink-soft)]">/mês</span>
              </p>
              <ul className="mx-auto mt-7 grid max-w-md gap-2 text-left">
                {[
                  "Academia Atípica completa",
                  "Receitas e materiais em PDF",
                  "Vídeos e biblioteca",
                  "Comunidade moderada",
                  "Novos conteúdos todo mês",
                  "Cancelamento quando quiser",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm font-semibold text-[var(--ink)]">
                    <Check size={16} className="mt-0.5 shrink-0 text-[var(--sage-deep)]" /> {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={goCheckout}
                className="pressable mt-8 h-14 w-full rounded-xl bg-[var(--sage-deep)] text-base font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[var(--ink)]"
              >
                {ctaLabel} <ArrowRight className="ml-3" size={18} />
              </Button>
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
                <ShieldCheck size={14} /> Pagamento seguro · sua conta é criada após a confirmação
              </p>
            </div>
          </div>
        </section>

        {/* DÚVIDAS */}
        <section id="duvidas" className="scroll-mt-24 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-20">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">Dúvidas</p>
            <h2 className="display-font mt-3 text-4xl font-semibold tracking-[-0.035em] text-[var(--ink)]">
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible className="mt-7">
              {FAQ.map(item => (
                <AccordionItem key={item.q} value={item.q} className="border-[var(--line)]">
                  <AccordionTrigger className="text-left text-sm font-extrabold text-[var(--ink)]">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-[var(--ink-soft)]">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--linen)] p-5 text-sm text-[var(--ink-soft)]">
              Já é membro?{" "}
              <Link href="/entrar" className="font-extrabold text-[var(--sage-deep)] hover:underline">
                Entrar na plataforma
              </Link>
            </div>
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
