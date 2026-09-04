import { useAuth } from "@/_core/hooks/useAuth";
import { CardRail, ContentCard } from "@/components/ContentCard";
import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpen,
  ChefHat,
  CircleHelp,
  MessageCircleMore,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const faq = [
  {
    question: "O que está incluído no meu acesso?",
    answer:
      "Sua assinatura dá acesso a todo o Universo Atípico: receitas, guias da Academia Atípica, sua biblioteca pessoal, a comunidade e a área de facilitadores.",
  },
  {
    question: "Como encontro um material que comecei a ler?",
    answer:
      "Tudo o que você abre fica registrado na Biblioteca, com a página em que parou. A seção “Continue de onde parou” aqui no início também traz os materiais mais recentes.",
  },
  {
    question: "Como funciona a Academia Atípica?",
    answer:
      "A Academia reúne guias e conteúdos organizados por tema, para você percorrer no seu ritmo. Não há prazo: comece, pause e volte quando fizer sentido.",
  },
  {
    question: "Como acesso meus PDFs?",
    answer:
      "Basta abrir o material desejado. O PDF é exibido dentro da plataforma, com leitura ajustada para celular e o progresso salvo automaticamente.",
  },
  {
    question: "Como funciona a assinatura de R$ 49,90/mês?",
    answer:
      "É uma assinatura mensal que mantém seu acesso completo ativo. Você acompanha status, próxima cobrança e histórico em Minha assinatura.",
  },
  {
    question: "Como faço para cancelar?",
    answer:
      "O cancelamento é feito por você mesma em Minha assinatura, a qualquer momento, e o acesso permanece até o fim do período já pago.",
  },
  {
    question: "Os conteúdos substituem acompanhamento profissional?",
    answer:
      "Não. Os materiais têm caráter educativo e informativo e não substituem avaliação, diagnóstico ou tratamento por profissionais de saúde ou educação.",
  },
];

function SectionShell({
  label,
  title,
  actionLabel,
  actionHref,
  children,
}: {
  label: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <SectionHeading
        label={label}
        title={title}
        action={
          actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="shrink-0 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--sage-deep)] underline underline-offset-4"
            >
              {actionLabel}
            </Link>
          ) : undefined
        }
      />
      {children}
    </section>
  );
}

export default function Inicio() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const dashboard = trpc.community.memberDashboard.useQuery();
  const taxonomy = trpc.community.taxonomy.useQuery();
  const data = dashboard.data;

  const firstName = (user?.name || "").split(" ")[0] || "por aqui";
  const eyebrow = "Início";
  const title = `Olá, ${firstName}.`;
  const description = "Continue explorando o seu Universo.";

  if (dashboard.isLoading) {
    return (
      <MemberShell eyebrow={eyebrow} title={title} description={description}>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-3xl bg-[var(--linen)]" />
          ))}
        </div>
      </MemberShell>
    );
  }

  if (dashboard.isError) {
    const restricted = dashboard.error?.message?.startsWith("ACESSO_RESTRITO");
    return (
      <MemberShell eyebrow={eyebrow} title={title} description={description}>
        <ContentEmpty
          icon={BookOpen}
          title={
            restricted
              ? "Seu acesso ainda não está ativo"
              : "Não conseguimos abrir seu início agora"
          }
          text={
            restricted
              ? "A assinatura de R$ 49,90/mês libera todo o Universo Atípico. Verifique o status em Minha assinatura."
              : "Tente atualizar a página em alguns instantes."
          }
        />
        {restricted ? (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setLocation("/minha-assinatura")}
              className="pressable h-12 rounded-xl bg-[var(--sage-deep)] px-6 font-bold text-white hover:bg-[var(--ink)]"
            >
              Ver minha assinatura <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        ) : null}
      </MemberShell>
    );
  }

  const progress = data?.progress ?? [];
  const guides = (data?.guides ?? []).slice(0, 3);
  const recipes = (data?.recipes ?? []).slice(0, 3);
  const videos = data?.videos ?? [];

  const openGuide = (id: number) => {
    const guide = data?.guides?.find((item) => item.id === id);
    const module = taxonomy.data?.academyModules?.find((item: any) => item.id === guide?.moduleId);
    setLocation(module ? `/academia/${module.slug}?guide=${id}` : "/academia");
  };
  const openRecipe = (id: number) => setLocation(`/receitas?guide=${id}`);

  return (
    <MemberShell eyebrow={eyebrow} title={title} description={description}>
      <section className="relative overflow-hidden rounded-[2rem] bg-[var(--ink)] p-7 text-white shadow-[0_24px_60px_rgba(8,31,77,.12)] sm:p-9">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#efd4a2]">
              <Sparkles size={13} /> Seu Universo hoje
            </span>
            <h2 className="display-font mt-5 max-w-2xl text-4xl font-semibold leading-[0.98] sm:text-5xl">
              Um próximo passo possível, no seu ritmo.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
              Retome uma leitura, encontre uma receita ou participe de uma conversa com outras
              famílias.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                onClick={() => setLocation("/academia")}
                className="bg-[#efd4a2] text-[var(--ink)] hover:bg-white"
              >
                Explorar Academia <ArrowRight size={15} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/comunidade")}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <MessageCircleMore size={15} className="mr-2" />
                Ir para a comunidade
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-80">
            {[
              [progress.length, "em andamento"],
              [data?.guides?.length ?? 0, "guias"],
              [data?.recipes?.length ?? 0, "receitas"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur"
              >
                <strong className="display-font block text-3xl font-semibold">{value}</strong>
                <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/55">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {progress.length ? (
        <SectionShell
          label="Continuar"
          title="Continue de onde parou"
          actionLabel="Ver biblioteca"
          actionHref="/biblioteca"
        >
          <CardRail>
            {progress.map((item) => (
              <ContentCard
                key={`${item.sourceType}-${item.documentId}`}
                title={item.title}
                category={item.category}
                coverImageUrl={item.coverImageUrl}
                accentColor={item.accentColor}
                progress={{
                  percent: item.percent,
                  currentPage: item.currentPage,
                  pageCount: item.pageCount,
                }}
                ctaLabel={`Continuar da página ${item.currentPage}`}
                onClick={() =>
                  item.sourceType === "testGuide"
                    ? openRecipe(item.documentId)
                    : openGuide(item.documentId)
                }
              />
            ))}
          </CardRail>
        </SectionShell>
      ) : null}

      <SectionShell
        label="Descobrir"
        title="Guias em destaque"
        actionLabel="Ver todos"
        actionHref="/academia"
      >
        {guides.length ? (
          <CardRail>
            {guides.map((guide) => (
              <ContentCard
                key={guide.id}
                title={guide.title}
                category={guide.category}
                summary={guide.summary}
                coverImageUrl={guide.coverImageUrl}
                ctaLabel="Abrir guia"
                onClick={() => openGuide(guide.id)}
              />
            ))}
          </CardRail>
        ) : (
          <ContentEmpty
            icon={BookOpen}
            title="Nenhum guia publicado ainda"
            text="Assim que novos guias forem publicados, eles aparecem aqui."
          />
        )}
      </SectionShell>

      <SectionShell
        label="Explorar"
        title="Receitas para a rotina real"
        actionLabel="Ver todas"
        actionHref="/receitas"
      >
        {recipes.length ? (
          <CardRail>
            {recipes.map((recipe) => (
              <ContentCard
                key={recipe.id}
                title={recipe.title}
                category={recipe.category}
                summary={recipe.summary}
                coverImageUrl={recipe.coverImageUrl}
                accentColor={recipe.accentColor}
                ctaLabel="Abrir receita"
                onClick={() => openRecipe(recipe.id)}
              />
            ))}
          </CardRail>
        ) : (
          <ContentEmpty
            icon={ChefHat}
            title="Nenhuma receita publicada ainda"
            text="As receitas do Universo aparecem aqui assim que forem publicadas."
          />
        )}
      </SectionShell>

      <SectionShell label="Assistir" title="Vídeos">
        {videos.length ? (
          <CardRail>
            {videos.map((video) => (
              <ContentCard
                key={video.id}
                title={video.title}
                summary={video.description}
                coverImageUrl={video.coverImageUrl}
                ctaLabel="Assistir"
                onClick={() => window.open(video.url, "_blank", "noopener")}
              />
            ))}
          </CardRail>
        ) : (
          <ContentEmpty
            icon={PlayCircle}
            title="Ainda não há vídeos por aqui"
            text="Novos vídeos serão reunidos aqui quando estiverem disponíveis."
          />
        )}
      </SectionShell>

      <SectionShell label="Tirar dúvidas" title="Perguntas frequentes">
        <div className="rounded-3xl border border-[var(--line)] bg-white px-5 py-2 sm:px-7">
          <Accordion type="single" collapsible>
            {faq.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className="border-[var(--line)]"
              >
                <AccordionTrigger className="text-left text-sm font-extrabold text-[var(--ink)]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-[var(--ink-soft)]">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-[var(--sage-deep)]">
          <Link
            href="/ajuda"
            className="inline-flex items-center gap-1.5 underline underline-offset-4"
          >
            <CircleHelp size={14} /> Ajuda e segurança
          </Link>
          <Link href="/minha-assinatura" className="underline underline-offset-4">
            Minha assinatura
          </Link>
          <Link href="/termos" className="underline underline-offset-4">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="underline underline-offset-4">
            Política de privacidade
          </Link>
        </div>
      </SectionShell>
    </MemberShell>
  );
}
