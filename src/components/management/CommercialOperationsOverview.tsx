import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BarChart3, CheckCircle2, Megaphone, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <article className="rounded-3xl border border-[#dfe6ee] bg-white p-5 shadow-[0_12px_30px_rgba(8,31,77,.04)]"><strong className="display-font block text-4xl font-semibold tracking-[-.04em]">{value}</strong><span className="mt-2 block text-sm font-extrabold">{label}</span><span className="mt-1 block text-xs leading-5 text-[#60708a]">{detail}</span></article>;
}

function Row({ label, value, href }: { label: string; value: number; href: string }) {
  return <Link href={href} className="group flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-[#dfe6ee] bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/30"><span className="font-bold text-[#60708a]">{label}</span><span className="inline-flex items-center gap-2 font-extrabold text-[#082c62]">{value}<ArrowRight size={15} className="transition group-hover:translate-x-1" /></span></Link>;
}

export function CommercialOperationsOverview() {
  const { user } = useAuth();
  const dashboard = trpc.community.master.dashboard.useQuery(undefined, { enabled: user?.accessRole === "admin_master" });
  if (dashboard.isLoading) return <section className="mb-8 min-h-40 animate-pulse rounded-3xl border border-[#dfe6ee] bg-white" aria-label="Carregando visão comercial" />;
  if (dashboard.isError || !dashboard.data) return null;
  const { stats, products, campaigns } = dashboard.data;
  const activeCampaigns = campaigns.filter((item) => item.status === "active").length;
  const draftProducts = products.filter((item) => item.status === "draft").length;
  return <section className="mb-10" aria-labelledby="commercial-operations-title"><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#2f8f68]">Dados reais de operação</p><h2 id="commercial-operations-title" className="display-font mt-2 text-3xl font-semibold">Pulso comercial</h2></div><div className="flex flex-wrap gap-2"><Link href="/gestao/comercial/produtos" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#082c62] px-4 text-xs font-extrabold text-white"><ShoppingBag size={16} />Gerir produtos</Link><Link href="/gestao/comercial/campanhas" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cdd8e6] bg-white px-4 text-xs font-extrabold"><Megaphone size={16} />Criar campanha</Link></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Cliques rastreados" value={stats.clicks} detail="Interesse nos links comerciais" /><Metric label="Conversões confirmadas" value={stats.confirmedConversions} detail="Sem contar intenção de compra" /><Metric label="Receita confirmada" value={money(stats.confirmedRevenueCents)} detail="Valores registrados na operação" /><Metric label="Produtos publicados" value={stats.publishedProducts} detail={`${products.length} produtos cadastrados`} /></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><article className="rounded-3xl bg-[#082c62] p-6 text-white sm:p-7"><BarChart3 className="text-[#f4c96b]" size={22} /><h3 className="display-font mt-5 text-3xl font-semibold">Funil em acompanhamento</h3><p className="mt-2 text-sm leading-6 text-white/65">Acompanhe interesse e confirmações sem inferir vendas que não foram registradas.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><Row label="Campanhas ativas" value={activeCampaigns} href="/gestao/comercial/campanhas" /><Row label="Produtos em rascunho" value={draftProducts} href="/gestao/comercial/produtos" /></div></article><article className="rounded-3xl border border-[#dfe6ee] bg-[#f7fbff] p-6 sm:p-7"><CheckCircle2 className="text-[#2f8f68]" size={22} /><h3 className="mt-5 text-lg font-extrabold">Leitura por origem</h3><p className="mt-2 text-sm leading-6 text-[#60708a]">Compare onde os cliques aconteceram antes de decidir quais campanhas priorizar.</p><div className="mt-5 space-y-2"><Row label="Origem pública" value={stats.publicClicks} href="/gestao/comercial/funil" /><Row label="Área do cliente" value={stats.clientClicks} href="/gestao/comercial/funil" /></div></article></div></section>;
}
