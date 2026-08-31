import { ContentEmpty, MemberShell } from "@/components/MemberShell";
import { Card, EmptyState, SearchField, SectionTitle, SelectField, SkeletonGrid, Toolbar, ds } from "@/components/ds";
import PdfReader from "@/components/PdfReaderClient";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BookOpen, Clock3, Download, ExternalLink, FileDown, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function dateLabel(value: Date | string | null) {
  if (!value) return "Disponível agora";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function editorialCategory(category: string) {
  const normalized = category.toLocaleLowerCase("pt-BR");
  if (normalized.includes("aliment")) return "Navegar";
  if (normalized.includes("rotina") || normalized.includes("apoio")) return "Conhecer";
  if (normalized.includes("desenvolv") || normalized.includes("prátic")) return "Praticar";
  return category;
}

function readingTime(guide: { summary: string; content?: string | null }) {
  const words = `${guide.summary || ""} ${guide.content || ""}`.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 180))} min de leitura`;
}

type ReadingGuide = { title: string; url: string; progressKey: string };

export default function Library() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const dashboard = trpc.community.memberDashboard.useQuery(undefined, { enabled: Boolean(user) });
  const publicGuides = trpc.community.publicGuides.useQuery();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);
  const [reading, setReading] = useState<ReadingGuide | null>(null);
  const availableGuides = user ? dashboard.data?.guides : publicGuides.data;
  const categories = useMemo(() => ["Todos", ...Array.from(new Set<string>(availableGuides?.map((guide: any) => guide.category) || []))], [availableGuides]);
  const guides = useMemo(() => (availableGuides || []).filter(guide => (filter === "Todos" || guide.category === filter) && `${guide.title} ${guide.summary}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))), [availableGuides, filter, query]);
  const openReader = async (guide: NonNullable<typeof dashboard.data>["guides"][number]) => {
    if (!user) {
      toast.info("Ative sua assinatura para ler este PDF, salvar seu progresso e fazer anotações.");
      setLocation(`/entrar?next=${encodeURIComponent(`/biblioteca?guide=${guide.id}`)}`);
      return;
    }
    if (!guide.hasPdf) return toast.error("Este guia ainda não tem um PDF disponível.");
    try { setDownloading(guide.id); setReading({ title: guide.title, url: `/api/protected-pdf/guide/${guide.id}`, progressKey: `${user?.id ?? "guest"}:guide:${guide.id}` }); }
    catch { toast.error("Não foi possível preparar este PDF agora."); }
    finally { setDownloading(null); }
  };

  const closeReader = () => { setReading(null); setLocation("/biblioteca"); };

  useEffect(() => {
    const guideId = Number(new URLSearchParams(window.location.search).get("guide"));
    const guide = dashboard.data?.guides.find(item => item.id === guideId);
    if (guide && !reading && guide.hasPdf) setReading({ title: guide.title, url: `/api/protected-pdf/guide/${guide.id}`, progressKey: `${user?.id ?? "guest"}:guide:${guide.id}` });
  }, [dashboard.data?.guides, reading]);

  useEffect(() => {
    if (!reading) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeReader(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [reading]);

  const isLoading = user ? dashboard.isLoading : publicGuides.isLoading;
  const isError = user ? dashboard.isError : publicGuides.isError;
  if (isLoading) return <MemberShell allowGuest eyebrow="Biblioteca" title="Guias para acompanhar sua jornada" description="Organizando os materiais liberados para a comunidade."><div className="grid gap-4 md:grid-cols-2"><div className="h-72 animate-pulse rounded-3xl bg-[var(--linen)]" /><div className="h-72 animate-pulse rounded-3xl bg-[var(--linen)]" /></div></MemberShell>;
  if (isError) return <MemberShell allowGuest eyebrow="Biblioteca" title="Guias para acompanhar sua jornada" description="Não foi possível carregar os materiais agora."><ContentEmpty icon={BookOpen} title="A biblioteca não abriu desta vez" text="Tente atualizar a página ou volte mais tarde." /></MemberShell>;

  return <MemberShell allowGuest eyebrow="Biblioteca" title="Guias para acompanhar sua jornada" description="Materiais práticos, organizados com cuidado, para consultar no tempo e no ritmo que fizer sentido para sua família.">
    <section><SectionTitle label="Materiais liberados" title={`${availableGuides?.length || 0} guias disponíveis`} />
    <Toolbar columns="md:grid-cols-[1.6fr_1fr]">
      <SearchField value={query} onChange={setQuery} placeholder="Buscar por título ou resumo" label="Buscar na biblioteca" />
      <SelectField label="Filtrar por categoria" value={filter} onChange={event => setFilter(event.target.value)}>
        {categories.map(category => <option key={category}>{category}</option>)}
      </SelectField>
    </Toolbar>
    {guides.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{guides.map(guide => <article key={guide.id} className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_10px_28px_rgba(8,31,77,.04)] transition hover:shadow-[0_18px_38px_rgba(8,31,77,.08)]"><div className="relative"><div className="flex items-center justify-between gap-4"><span className="rounded-full bg-[var(--sage-pale)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage-deep)]">{editorialCategory(guide.category)}</span><BookOpen size={20} className="text-[var(--sage-deep)]" /></div><h3 className="display-font mt-6 text-2xl font-semibold leading-tight">{guide.title}</h3><p className="mt-4 min-h-12 text-sm leading-6 text-[var(--ink-soft)]">{guide.summary}</p>{guide.content ? <p className="mt-4 border-l-2 border-[var(--clay)] pl-3 text-xs leading-5 text-[var(--ink-soft)]">{guide.content}</p> : null}<div className="mt-6 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)]"><Clock3 size={14} />{readingTime(guide)}</span><Button onClick={() => openReader(guide)} disabled={!guide.hasPdf || downloading === guide.id} className="pressable rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"><FileDown size={15} className="mr-2" />{downloading === guide.id ? "Preparando..." : "Ler PDF"}</Button></div></div></article>)}</div> : <div className="mt-6"><ContentEmpty icon={BookOpen} title="Nenhum guia encontrado" text="Tente outro termo ou selecione uma categoria diferente." /></div>}</section>
    {reading ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,28,61,0.78)] p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Leitor: ${reading.title}`}><div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Leitor de PDF</p><h2 className="truncate text-sm font-extrabold sm:text-base">{reading.title}</h2></div><div className="flex shrink-0 items-center gap-1"><button type="button" onPointerDown={event => event.stopPropagation()} onClick={closeReader} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--ink-soft)] transition hover:bg-[var(--linen)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]" aria-label="Fechar leitor"><X size={22} strokeWidth={2} /></button></div></header><div className="min-h-0 flex-1 overflow-auto bg-[#e9e7e3]"><PdfReader src={reading.url} title={reading.title} progressSource="guide" documentId={Number(reading.progressKey.split(":").pop())} /></div><p className="border-t border-[var(--line)] px-4 py-2 text-center text-xs text-[var(--ink-soft)]">O conteúdo é protegido e disponibilizado somente para leitura dentro da plataforma.</p></div></div> : null}
  </MemberShell>;
}
