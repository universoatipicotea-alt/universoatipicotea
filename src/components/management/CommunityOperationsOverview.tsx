import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CircleAlert,
  HeartHandshake,
  Loader2,
  MessageCircleMore,
  ShieldCheck,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import { Link } from "wouter";

function CommunityMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof UsersRound;
}) {
  return (
    <article className="rounded-3xl border border-[#dfe6ee] bg-white p-5 shadow-[0_12px_30px_rgba(8,31,77,.04)]">
      <Icon size={19} className="text-[#2f8f68]" />
      <strong className="display-font mt-5 block text-4xl font-semibold tracking-[-.04em]">
        {value}
      </strong>
      <span className="mt-2 block text-sm font-extrabold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-[#60708a]">{detail}</span>
    </article>
  );
}

function QueueLink({
  label,
  value,
  href,
  attention = false,
}: {
  label: string;
  value: number;
  href: string;
  attention?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-[#dfe6ee] bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/30"
    >
      <span className="font-bold text-[#60708a]">{label}</span>
      <span
        className={`inline-flex items-center gap-2 font-extrabold ${attention && value > 0 ? "text-[#b9423a]" : "text-[#082c62]"}`}
      >
        {value} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function CommunityOperationsOverview() {
  const { user } = useAuth();
  const enabled = ["admin", "admin_master"].includes(user?.accessRole || "");
  const dashboard = trpc.community.admin.dashboard.useQuery(undefined, { enabled });

  if (dashboard.isLoading) {
    return (
      <section
        className="mb-8 flex min-h-40 items-center justify-center rounded-3xl border border-[#dfe6ee] bg-white"
        aria-label="Carregando visão da comunidade"
      >
        <Loader2 className="animate-spin text-[#2f8f68]" size={24} />
      </section>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <section className="mb-8 rounded-3xl border border-[#f2c7c2] bg-[#fff6f4] p-6">
        <CircleAlert className="text-[#d64e45]" size={22} />
        <h2 className="mt-4 text-lg font-extrabold">A visão da comunidade não carregou</h2>
        <p className="mt-2 text-sm leading-6 text-[#60708a]">
          As ferramentas de moderação e facilitadores continuam disponíveis abaixo.
        </p>
      </section>
    );
  }

  const { stats, topics, reports, facilitators } = dashboard.data;
  const openReports = reports.filter((item) => item.status === "open").length;
  const hiddenTopics = topics.filter((item) => item.status === "hidden").length;
  const visibleTopics = topics.filter((item) => item.status === "visible").length;
  const publishedFacilitators = facilitators.filter((item) => item.status === "published").length;
  const draftFacilitators = facilitators.filter((item) => item.status === "draft").length;

  return (
    <section className="mb-10" aria-labelledby="community-operations-title">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#2f8f68]">
            Dados reais da comunidade
          </p>
          <h2 id="community-operations-title" className="display-font mt-2 text-3xl font-semibold">
            Visão de relacionamento
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/gestao/comunidade/moderacao"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#082c62] px-4 text-xs font-extrabold text-white"
          >
            <ShieldCheck size={16} /> Abrir moderação
          </Link>
          <Link
            href="/gestao/comunidade/facilitadores"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cdd8e6] bg-white px-4 text-xs font-extrabold"
          >
            <ShoppingBag size={16} /> Gerir facilitadores
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CommunityMetric
          label="Membros cadastrados"
          value={stats.members}
          detail="Pessoas registradas na plataforma"
          icon={UsersRound}
        />
        <CommunityMetric
          label="Interações"
          value={stats.conversations}
          detail="Conversas e respostas existentes"
          icon={MessageCircleMore}
        />
        <CommunityMetric
          label="Denúncias abertas"
          value={openReports}
          detail="Itens aguardando revisão"
          icon={ShieldCheck}
        />
        <CommunityMetric
          label="Facilitadores publicados"
          value={publishedFacilitators}
          detail="Referências visíveis aos membros"
          icon={HeartHandshake}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl bg-[#082c62] p-6 text-white sm:p-7">
          <ShieldCheck className="text-[#f4c96b]" size={22} />
          <h3 className="display-font mt-5 text-3xl font-semibold">Fila de cuidado</h3>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Priorize denúncias e acompanhe conteúdos ocultos sem perder o histórico da comunidade.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <QueueLink
              label="Aguardando revisão"
              value={openReports}
              href="/gestao/comunidade/moderacao"
              attention
            />
            <QueueLink
              label="Conversas ocultas"
              value={hiddenTopics}
              href="/gestao/comunidade/moderacao"
            />
          </div>
        </article>
        <article className="rounded-3xl border border-[#dfe6ee] bg-[#f7fbff] p-6 sm:p-7">
          <HeartHandshake className="text-[#2f8f68]" size={22} />
          <h3 className="mt-5 text-lg font-extrabold">Operação ativa</h3>
          <p className="mt-2 text-sm leading-6 text-[#60708a]">
            Veja rapidamente o que está disponível e o que ainda está sendo preparado.
          </p>
          <div className="mt-5 space-y-2">
            <QueueLink
              label="Conversas visíveis"
              value={visibleTopics}
              href="/gestao/comunidade/moderacao"
            />
            <QueueLink
              label="Facilitadores em rascunho"
              value={draftFacilitators}
              href="/gestao/comunidade/facilitadores"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
