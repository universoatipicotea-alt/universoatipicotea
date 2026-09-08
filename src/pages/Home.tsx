import { Brand } from "@/components/Brand";
import { BrandOrbitHero } from "@/components/BrandOrbitHero";
import { PublicHeader } from "@/components/PublicHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { CountUp, Reveal } from "@/components/Motion";
import ResponsiveVisualAsset from "@/components/ResponsiveVisualAsset";
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
    <article className="interactive-card group overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_10px_30px_-22px_rgba(8,31,77,.5)]">
      <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-[var(--linen)]">
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt={`Capa de ${item.title}`}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1279px) 50vw, 33vw"
            className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <BookOpen size={26} className="text-[var(--sage-deep)]" />
        )}
      </div>
      <div className="p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">
          {item.category || badge}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-6 text-[var(--ink)]">
          {item.title}
        </h3>
        {item.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink-soft)]">
            {item.summary}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function Home() {
  const landing = trpc.community.landing.useQuery();
  const [, setLocation] = useLocation();
  const data = landing.data;

  const priceLabel = "R$ 49,90";
  const guides: PreviewItem[] = data?.preview?.guides ?? [];
  const recipes: PreviewItem[] = data?.preview?.recipes ?? [];

  const goCheckout = () => setLocation("/checkout");

  const pillars = [
    [
      BookOpen,
      "Academia Atípica",
      "Guias e materiais organizados por tema para apoiar decisões do dia a dia.",
    ],
    [
      ChefHat,
      "Receitas",
      "Ideias práticas para a alimentação real, com seletividade e rotina em mente.",
    ],
    [
      PlayCircle,
      "Vídeos e biblioteca",
      "Conteúdos curtos e materiais para consultar quando precisar.",
    ],
    [
      MessageCircleMore,
      "Comunidade",
      "Um espaço de escuta e troca entre famílias que vivem a mesma realidade.",
    ],
  ] as const;
  const communityMetrics = [
    { icon: Users, value: data?.metrics.members ?? 0, label: "membros" },
    { icon: BookOpen, value: data?.metrics.guides ?? 0, label: "materiais" },
    { icon: MessageCircleMore, value: data?.metrics.topics ?? 0, label: "conversas" },
  ];
  const showQuantitativeMetrics =
    communityMetrics[0].value >= 10 &&
    (communityMetrics[1].value >= 3 || communityMetrics[2].value >= 5);
  const qualitativeMetrics = [
    { icon: Users, title: "Comunidade em crescimento", label: "um espaço acolhedor para chegar" },
    { icon: BookOpen, title: "Acervo em evolução", label: "materiais organizados pela equipe" },
    {
      icon: MessageCircleMore,
      title: "Trocas com cuidado",
      label: "conversas moderadas e respeitosas",
    },
  ];

  return (
    <div className="page-texture min-h-screen overflow-hidden bg-[var(--paper)]">
      <PublicHeader />

      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-[var(--ink)]">
          <div className="hero-tech-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div
            className="aurora-float absolute -left-32 top-24 h-80 w-80 rounded-full bg-[var(--blue)]/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="mx-auto grid w-[calc(100vw-2rem)] min-w-0 max-w-[1440px] items-center gap-10 overflow-hidden pb-14 pt-8 sm:w-[calc(100vw-4rem)] sm:py-16 lg:min-h-[700px] lg:w-[calc(100vw-6rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,.92fr)] lg:py-20">
            <div className="relative z-10 flex min-w-0 flex-col justify-center">
              <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
                <Sparkles size={13} /> Assinatura Universo · R$ 49,90 por mês
              </div>
              <h1 className="display-font max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.4rem]">
                Apoio prático para transformar informação em{" "}
                <em className="font-semibold not-italic text-[#efd4a2]">caminhos possíveis</em>.
              </h1>
              <p className="mt-7 max-w-xl break-words text-base leading-8 text-white/80 sm:text-lg">
                Academia, receitas, biblioteca e comunidade reunidas para apoiar famílias atípicas
                com conteúdo organizado, acolhimento e menos ruído na rotina.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={goCheckout}
                  className="pressable h-14 min-w-[240px] rounded-xl bg-[#efd4a2] px-8 text-base font-extrabold uppercase tracking-[0.08em] text-[var(--ink)] shadow-[0_12px_24px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Assinar por R$ 49,90/mês <ArrowRight className="ml-3" size={19} />
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
                Renovação mensal · acesso liberado após a confirmação · cancele quando quiser.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/75">
                {[
                  "Pagamento seguro",
                  "Acesso imediato após confirmação",
                  "Cancelamento simples",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
                  >
                    <Check size={13} className="text-[#efd4a2]" /> {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative order-first min-w-0 lg:order-none">
              <BrandOrbitHero />
              <div className="absolute bottom-5 left-1/2 z-10 flex w-[calc(100%-2.5rem)] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/20 bg-[var(--ink)]/85 px-4 py-3 text-white shadow-2xl backdrop-blur sm:bottom-7 sm:w-auto sm:min-w-[320px] sm:px-5">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/55">
                    Plano completo
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold">
                    {priceLabel}
                    <span className="text-xs text-white/60">/mês</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goCheckout}
                  className="pressable rounded-xl bg-[#efd4a2] px-4 py-2 text-xs font-extrabold text-[var(--ink)]"
                >
                  Assinar
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-b border-[var(--line)] bg-white"
          aria-label="Benefícios da assinatura"
        >
          <div className="mx-auto grid max-w-6xl divide-y divide-[var(--line)] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
            {[
              "Um único plano, sem módulos avulsos",
              "Conteúdo organizado para consultar no seu ritmo",
              "Comunidade moderada com cuidado",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3 px-3 py-5 sm:px-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--sage-pale)] text-xs font-extrabold text-[var(--sage-deep)]">
                  {index + 1}
                </span>
                <p className="text-xs font-extrabold leading-5 text-[var(--ink)]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <ResponsiveVisualAsset
          slot="public_home"
          fallback={{
            desktopImageUrl: "/home-membros-universo-atipico-desktop.webp",
            tabletImageUrl: "/home-membros-universo-atipico-tablet.webp",
            mobileImageUrl: "/home-membros-universo-atipico-mobile.webp",
            altText: "Uma vida mais leve, juntos — Universo Atípico",
          }}
          defaultAlt="Imagem de apoio do Universo Atípico"
          pictureClassName="mx-auto mt-8 block aspect-video w-[calc(100%-2.5rem)] max-w-[1200px] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_18px_48px_rgba(8,31,77,.08)] sm:w-[calc(100%-4rem)]"
          className="h-full w-full object-contain"
          sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc(100vw - 64px), 1200px"
        />

        {/* SOBRE */}
        <section id="sobre" className="relative scroll-mt-24 overflow-hidden bg-[var(--linen)]">
          <div
            className="absolute -right-24 top-10 h-64 w-64 rounded-full border border-[var(--sage)]/15"
            aria-hidden="true"
          />
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <Reveal className="grid overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_24px_70px_rgba(8,31,77,.08)] lg:grid-cols-[.8fr_1.2fr]">
              <div className="relative overflow-hidden bg-[var(--ink)] p-7 text-white sm:p-9 lg:p-11">
                <div className="hero-tech-grid absolute inset-0 opacity-25" aria-hidden="true" />
                <div className="relative">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">
                    Sobre o Universo
                  </p>
                  <h2 className="display-font mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-white">
                    Feito por quem vive a rotina atípica.
                  </h2>
                  <p className="mt-5 text-sm leading-7 text-white/70">
                    Conhecimento que acolhe, organiza e ajuda você a encontrar o próximo passo.
                  </p>
                  <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#efd4a2]">
                    <Sparkles size={13} /> Conteúdo com propósito
                  </span>
                </div>
              </div>
              <div className="p-7 sm:p-9 lg:p-11">
                <div className="space-y-4 text-sm leading-7 text-[var(--ink-soft)]">
                  <p>
                    O Universo Atípico nasceu para reunir, em um lugar só, o que costuma estar
                    espalhado: informação confiável, materiais práticos e pessoas que entendem o dia
                    a dia de uma família atípica.
                  </p>
                  <p>
                    Não vendemos cursos soltos nem prometemos soluções rápidas. Oferecemos um acesso
                    contínuo, com conteúdo novo publicado ao longo do tempo e uma comunidade para
                    caminhar junto.
                  </p>
                </div>
                <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    "Assinatura única, sem venda de módulos avulsos",
                    "Conteúdo publicado e atualizado pela equipe",
                    "Comunidade moderada e respeitosa",
                  ].map((item, index) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-xs font-extrabold leading-5 text-[var(--ink)]"
                    >
                      <span className="mb-3 grid h-7 w-7 place-items-center rounded-full bg-[var(--sage-pale)] text-[10px] text-[var(--sage-deep)]">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* O QUE VOCÊ ENCONTRA */}
        <section id="o-que-encontra" className="scroll-mt-24">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-18">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">
                O que você encontra
              </p>
              <h2 className="display-font mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-[var(--ink)]">
                Tudo incluído na mesma assinatura.
              </h2>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map(([Icon, title, text], index) => (
                <Reveal
                  as="article"
                  key={title}
                  delay={index * 70}
                  className="interactive-card group relative min-h-56 overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_14px_36px_rgba(8,31,77,.05)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--sage-pale)] text-[var(--sage-deep)]">
                    <Icon size={21} />
                  </span>
                  <h3 className="display-font mt-5 text-xl font-semibold text-[var(--ink)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>
                  <span
                    className="absolute bottom-0 left-0 h-1 w-0 bg-[var(--sage)] transition-all duration-300 group-hover:w-full"
                    aria-hidden="true"
                  />
                </Reveal>
              ))}
            </div>

            {guides.length ? (
              <div className="mt-14">
                <h3 className="display-font text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Materiais já publicados na Academia Atípica
                </h3>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {guides.slice(0, 3).map((item) => (
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
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {recipes.slice(0, 3).map((item) => (
                    <PreviewCard key={item.id} item={item} badge="Receita" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* COMUNIDADE */}
        <section
          id="comunidade"
          className="relative scroll-mt-24 overflow-hidden bg-[var(--sage-deep)] text-white"
        >
          <div
            className="aurora-float absolute -right-28 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:py-20">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#efd4a2]">
                Comunidade
              </p>
              <h2 className="display-font mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-white">
                Você não precisa atravessar isso sozinha.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">
                Um espaço para perguntar, contar como foi o dia e ler experiências de quem entende.
                Sem julgamento, com moderação e cuidado com a privacidade de cada família.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {(showQuantitativeMetrics ? communityMetrics : qualitativeMetrics).map(
                  (metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <Reveal
                        key={metric.label}
                        delay={index * 80}
                        className="interactive-card rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                      >
                        <Icon size={18} className="text-[#efd4a2]" />
                        <strong className="display-font mt-3 block text-xl font-semibold text-white">
                          {"value" in metric ? <CountUp value={metric.value} /> : metric.title}
                        </strong>
                        <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/55">
                          {metric.label}
                        </span>
                      </Reveal>
                    );
                  },
                )}
              </div>
            </div>
            <div className="relative rounded-3xl border border-white/15 bg-white p-7 text-[var(--ink)] shadow-[0_24px_60px_rgba(0,0,0,.18)]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
                Como funciona
              </p>
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
        <section
          id="assinatura"
          className="relative scroll-mt-24 overflow-hidden bg-[var(--paper)]"
        >
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-20">
            <Reveal className="relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white p-7 text-center shadow-[0_28px_80px_rgba(8,31,77,.12)] sm:p-10">
              <div
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--blue)] via-[var(--green)] to-[var(--gold)]"
                aria-hidden="true"
              />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">
                Plano Universo
              </p>
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
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-semibold text-[var(--ink)]"
                  >
                    <Check size={16} className="mt-0.5 shrink-0 text-[var(--sage-deep)]" /> {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={goCheckout}
                className="pressable mt-8 h-14 w-full rounded-xl bg-[var(--sage-deep)] text-base font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[var(--ink)]"
              >
                Assinar agora <ArrowRight className="ml-3" size={18} />
              </Button>
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
                <ShieldCheck size={14} /> Pagamento seguro · sua conta é criada após a confirmação
              </p>
            </Reveal>
          </div>
        </section>

        {/* DÚVIDAS */}
        <section id="duvidas" className="scroll-mt-24 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-20">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">
              Dúvidas
            </p>
            <h2 className="display-font mt-3 text-4xl font-semibold tracking-[-0.035em] text-[var(--ink)]">
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible className="mt-7">
              {FAQ.map((item) => (
                <AccordionItem key={item.q} value={item.q} className="border-[var(--line)]">
                  <AccordionTrigger className="text-left text-sm font-extrabold text-[var(--ink)]">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-[var(--ink-soft)]">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--linen)] p-5 text-sm text-[var(--ink-soft)]">
              Já é membro?{" "}
              <Link
                href="/entrar"
                className="font-extrabold text-[var(--sage-deep)] hover:underline"
              >
                Entrar na plataforma
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 p-3 shadow-[0_-10px_30px_rgba(8,31,77,.08)] backdrop-blur sm:hidden">
        <Button
          onClick={goCheckout}
          className="h-12 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white"
        >
          Assinar por R$ 49,90/mês <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>

      <footer className="border-t border-[var(--line)] bg-white px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <Brand compact />
            <p className="text-xs text-[var(--ink-soft)]">
              Universo Atípico. Conhecimento, experiências, pessoas e soluções para a realidade
              atípica.
            </p>
          </div>
          <InstitutionalFooter />
        </div>
      </footer>
    </div>
  );
}
