import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import PdfReader from "@/components/PdfReaderClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BookOpen, CheckCircle2, Eye, FileUp, ImageUp, Lightbulb, Loader2, Maximize2, PackageOpen, Save, Sparkles, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const categories = ["Rotina", "Comunicação", "Escola", "Comportamento", "Autocuidado", "Direitos", "Outros"];

type TestGuideForm = {
  id?: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  callout: string;
  accentColor: string;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  pdfKey: string | null;
  pdfUrl: string | null;
  status: "draft" | "published";
};

const newTestGuide = (): TestGuideForm => ({ title: "", summary: "", content: "", category: "Rotina", callout: "", accentColor: "#0b2b26", coverImageKey: null, coverImageUrl: null, pdfKey: null, pdfUrl: null, status: "draft" });

async function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Facilitators() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const dashboard = trpc.community.memberDashboard.useQuery();
  const testGuides = trpc.community.testGuides.list.useQuery();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState("Todos");
  const [tab, setTab] = useState<"facilitators" | "test-product">(() => new URLSearchParams(window.location.search).get("tab") === "test-product" ? "test-product" : "facilitators");
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(() => {
    const value = Number(new URLSearchParams(window.location.search).get("guide"));
    return Number.isInteger(value) && value > 0 ? value : null;
  });
  const [guideForm, setGuideForm] = useState<TestGuideForm>(newTestGuide());
  const [replaceCoverGuideId, setReplaceCoverGuideId] = useState<number | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const replaceCoverInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const isMaster = user?.role === "master";
  const categoriesInUse = useMemo(() => ["Todos", ...Array.from(new Set<string>(dashboard.data?.facilitators.map(item => item.category) || []))], [dashboard.data?.facilitators]);
  const items = useMemo(() => (dashboard.data?.facilitators || []).filter(item => filter === "Todos" || item.category === filter), [dashboard.data?.facilitators, filter]);
  const selectedGuide = testGuides.data?.find(item => item.id === selectedGuideId) ?? null;
  const closeReader = () => { setSelectedGuideId(null); setLocation("/facilitadores?tab=test-product"); };

  useEffect(() => {
    if (selectedGuide && readerRef.current) readerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedGuide]);

  useEffect(() => {
    if (!selectedGuideId) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeReader(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedGuideId]);

  const saveTestGuide = trpc.community.master.saveTestGuide.useMutation({
    onSuccess: async () => {
      await utils.community.testGuides.list.invalidate();
      setGuideForm(newTestGuide());
      toast.success("Guia de teste salvo.");
    },
    onError: error => toast.error(error.message),
  });
  const uploadPdf = trpc.community.files.uploadGuidePdf.useMutation({
    onSuccess: result => {
      setGuideForm(current => ({ ...current, pdfKey: result.key, pdfUrl: result.url }));
      toast.success("PDF carregado. Salve o guia para confirmar.");
    },
    onError: error => toast.error(error.message),
  });
  const uploadCover = trpc.community.files.uploadContentImage.useMutation({
    onSuccess: result => {
      setGuideForm(current => ({ ...current, coverImageKey: result.key, coverImageUrl: result.url }));
      toast.success("Capa carregada. Salve o guia para confirmar.");
    },
    onError: error => toast.error(error.message),
  });
  const replaceGuideCover = trpc.community.master.updateTestGuideCover.useMutation({
    onSuccess: async () => {
      await utils.community.testGuides.list.invalidate();
      setReplaceCoverGuideId(null);
      toast.success("Capa substituída com sucesso.");
    },
    onError: error => toast.error(error.message),
  });

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>, kind: "pdf" | "cover") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isPdf = kind === "pdf";
    const accepted = isPdf ? ["application/pdf"] : ["image/jpeg", "image/png", "image/webp"];
    const max = isPdf ? 50 * 1024 * 1024 : 6 * 1024 * 1024;
    if (!accepted.includes(file.type)) { toast.error(isPdf ? "Envie um PDF válido." : "Envie uma capa JPG, PNG ou WEBP."); return; }
    if (file.size > max) { toast.error(isPdf ? "O PDF excede o limite de 50 MB." : "A capa excede o limite de 6 MB."); return; }
    try {
      const dataUrl = await readAsDataUrl(file);
      if (isPdf) await uploadPdf.mutateAsync({ fileName: file.name, dataUrl });
      else await uploadCover.mutateAsync({ fileName: file.name, dataUrl });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar o arquivo.");
    } finally {
      event.target.value = "";
    }
  };

  const submitTestGuide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveTestGuide.mutateAsync({ ...guideForm, content: guideForm.content || null, callout: guideForm.callout || null });
  };

  const replaceCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const guideId = replaceCoverGuideId;
    event.target.value = "";
    if (!file || !guideId) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Envie uma capa JPG, PNG ou WEBP."); return; }
    if (file.size > 6 * 1024 * 1024) { toast.error("A capa excede o limite de 6 MB."); return; }
    try {
      const dataUrl = await readAsDataUrl(file);
      const uploaded = await uploadCover.mutateAsync({ fileName: file.name, dataUrl });
      await replaceGuideCover.mutateAsync({ guideId, coverImageKey: uploaded.key, coverImageUrl: uploaded.url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível substituir a capa.");
      setReplaceCoverGuideId(null);
    }
  };

  if (dashboard.isLoading) return <MemberShell eyebrow="Facilitadores" title="Referências para a rotina" description="Organizando a seleção de recursos da comunidade."><div className="grid gap-4 md:grid-cols-3"><div className="h-64 animate-pulse rounded-3xl bg-[var(--linen)]" /><div className="h-64 animate-pulse rounded-3xl bg-[var(--linen)]" /><div className="h-64 animate-pulse rounded-3xl bg-[var(--linen)]" /></div></MemberShell>;
  if (dashboard.isError) return <MemberShell eyebrow="Facilitadores" title="Referências para a rotina" description="Não foi possível carregar a seleção agora."><ContentEmpty icon={Lightbulb} title="A seleção não abriu desta vez" text="Tente atualizar a página ou volte mais tarde." /></MemberShell>;

  return <MemberShell eyebrow="Facilitadores" title="Referências para a rotina" description="Uma seleção editorial de recursos que podem facilitar a organização, o cuidado e os pequenos momentos do dia a dia.">
    <section className="rounded-3xl bg-[#ede7da] p-6 sm:p-8"><Sparkles size={20} className="text-[var(--clay)]" /><h2 className="display-font mt-5 max-w-2xl text-4xl font-semibold leading-[0.95]">Curadoria, não uma vitrine.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">Cada referência publicada deve explicar com clareza por que faz sentido para a comunidade.</p></section>
    <section className="mt-10"><div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-3"><button type="button" onClick={() => setTab("facilitators")} className={`rounded-full px-4 py-2 text-xs font-extrabold ${tab === "facilitators" ? "bg-[var(--sage-deep)] text-white" : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)]"}`}>Facilitadores</button><button type="button" onClick={() => setTab("test-product")} className={`rounded-full px-4 py-2 text-xs font-extrabold ${tab === "test-product" ? "bg-[var(--sage-deep)] text-white" : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)]"}`}>Produto teste</button></div>
      {tab === "facilitators" ? <><SectionHeading label="Seleção da comunidade" title="Facilitadores publicados" /><div className="mt-2 flex gap-2 overflow-x-auto pb-2">{categoriesInUse.map(category => <button key={category} type="button" onClick={() => setFilter(category)} className={`pressable shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${filter === category ? "bg-[var(--sage-deep)] text-white" : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)] hover:bg-[var(--linen)]"}`}>{category}</button>)}</div>{items.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <article key={item.id} className="soft-card flex min-h-72 flex-col rounded-3xl p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--lavender)] text-[var(--sage-deep)]"><Lightbulb size={19} /></span><span className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage)]">{item.category}</span><h3 className="display-font mt-2 text-3xl font-semibold leading-none">{item.title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[var(--ink-soft)]">{item.summary}</p>{item.linkUrl ? <a href={item.linkUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[var(--sage-deep)] hover:underline">{item.sourceLabel || "Abrir referência"}<ArrowUpRight size={14} /></a> : <span className="mt-5 text-xs font-bold text-[var(--ink-soft)]">Referência em breve</span>}</article>)}</div> : <div className="mt-6"><ContentEmpty icon={Lightbulb} title="A seleção está sendo construída" text="Quando a administração publicar uma referência, ela aparecerá aqui com o contexto necessário." /></div>}</> : <div className="mt-6 space-y-7">
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><article className="rounded-3xl bg-[var(--sage-deep)] p-7 text-white"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><PackageOpen size={22} className="text-[#efd4a2]" /></span><p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#efd4a2]">Demonstração isolada</p><h2 className="display-font mt-2 text-4xl font-semibold">Guias em teste</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/75">Crie capas e apresentações antes de publicar conteúdo definitivo. Os itens desta aba ficam separados da biblioteca real.</p><div className="mt-6 flex items-center gap-2 text-xs font-bold text-white/70"><CheckCircle2 size={16} /> Sem checkout, avaliações ou dados de clientes</div></article><article className="soft-card rounded-3xl p-7"><h3 className="display-font text-2xl font-semibold">Como funciona</h3><div className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-soft)]"><p>Cadastre título, resumo, chamada, categoria e cor de destaque.</p><p>Envie uma capa e um PDF para visualizar o material sem sair do sistema.</p><p>Salve como rascunho para revisar ou publique apenas quando estiver pronto.</p></div></article></div>
        {isMaster ? <>
          <section className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]">Administração visual</p><h2 className="display-font mt-2 text-3xl font-semibold">Capas das receitas</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">Substitua rapidamente a capa de qualquer receita sem editar o PDF, o título ou os demais dados do material.</p></div><span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-xs font-extrabold text-[var(--sage-deep)]">{testGuides.data?.length ?? 0} materiais</span></div>
            <input ref={replaceCoverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={replaceCoverFile} />
            {testGuides.data?.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{testGuides.data.map(guide => <article key={guide.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]"><div className="h-32" style={{ backgroundColor: guide.accentColor }}>{guide.coverImageUrl ? <img src={guide.coverImageUrl} alt={`Capa atual de ${guide.title}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs font-extrabold uppercase tracking-[0.15em] text-white/70">Fallback editorial</div>}</div><div className="p-4"><h3 className="display-font line-clamp-2 text-xl font-semibold leading-tight">{guide.title}</h3><p className="mt-2 text-xs text-[var(--ink-soft)]">{guide.coverImageUrl ? "Capa personalizada" : "Usando capa fallback"}</p><Button type="button" variant="outline" onClick={() => { setReplaceCoverGuideId(guide.id); replaceCoverInput.current?.click(); }} disabled={uploadCover.isPending || replaceGuideCover.isPending} className="pressable mt-4 w-full rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]"><ImageUp size={14} className="mr-2" />{replaceCoverGuideId === guide.id && (uploadCover.isPending || replaceGuideCover.isPending) ? "Enviando..." : "Substituir capa"}</Button></div></article>)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-[var(--line)] p-5 text-sm text-[var(--ink-soft)]">Nenhuma receita cadastrada para receber capa.</p>}
          </section>
          <form onSubmit={submitTestGuide} className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]">{guideForm.id ? "Editar guia de teste" : "Novo guia de teste"}</p><h2 className="display-font mt-2 text-3xl font-semibold">Personalize a apresentação</h2></div>{guideForm.id ? <button type="button" onClick={() => setGuideForm(newTestGuide())} className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-[var(--linen)]" aria-label="Cancelar edição"><X size={18} /></button> : null}</div><div className="mt-7 grid gap-5 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label htmlFor="test-guide-title">Título do guia</Label><Input id="test-guide-title" value={guideForm.title} onChange={event => setGuideForm(current => ({ ...current, title: event.target.value }))} placeholder="Ex.: Rotina visual para a manhã" minLength={4} maxLength={180} required /></div><div className="space-y-2"><Label htmlFor="test-guide-category">Categoria</Label><select id="test-guide-category" value={guideForm.category} onChange={event => setGuideForm(current => ({ ...current, category: event.target.value }))} className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm">{categories.map(category => <option key={category}>{category}</option>)}</select></div><div className="space-y-2"><Label htmlFor="test-guide-color">Cor de destaque</Label><div className="flex h-11 items-center gap-3 rounded-xl border border-[var(--line)] px-3"><input id="test-guide-color" type="color" value={guideForm.accentColor} onChange={event => setGuideForm(current => ({ ...current, accentColor: event.target.value }))} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" /><span className="font-mono text-xs text-[var(--ink-soft)]">{guideForm.accentColor}</span></div></div><div className="space-y-2 md:col-span-2"><Label htmlFor="test-guide-summary">Resumo</Label><Textarea id="test-guide-summary" value={guideForm.summary} onChange={event => setGuideForm(current => ({ ...current, summary: event.target.value }))} placeholder="Explique em poucas linhas para quem este guia pode ser útil." minLength={12} maxLength={1200} required /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="test-guide-callout">Chamada de capa <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label><Input id="test-guide-callout" value={guideForm.callout} onChange={event => setGuideForm(current => ({ ...current, callout: event.target.value }))} placeholder="Uma frase curta que aparece em destaque" maxLength={240} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="test-guide-content">Personalização e contexto <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label><Textarea id="test-guide-content" value={guideForm.content} onChange={event => setGuideForm(current => ({ ...current, content: event.target.value }))} placeholder="Contextualize o material e explique como ele pode ser usado." maxLength={12000} className="min-h-32" /></div></div><input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => uploadFile(event, "cover")} /><input ref={pdfInput} type="file" accept="application/pdf" className="sr-only" onChange={event => uploadFile(event, "pdf")} /><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => coverInput.current?.click()} disabled={uploadCover.isPending} className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-left hover:bg-[var(--linen)]"><ImageUp size={19} className="text-[var(--sage-deep)]" /><strong className="mt-3 block text-xs">{guideForm.coverImageKey ? "Capa carregada" : "Adicionar capa"}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">JPG, PNG ou WEBP até 6 MB</span></button><button type="button" onClick={() => pdfInput.current?.click()} disabled={uploadPdf.isPending} className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-left hover:bg-[var(--linen)]"><FileUp size={19} className="text-[var(--sage-deep)]" /><strong className="mt-3 block text-xs">{guideForm.pdfKey ? "PDF carregado" : "Adicionar PDF"}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">PDF até 50 MB, lido dentro do sistema</span></button></div>{guideForm.coverImageUrl ? <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]"><img src={guideForm.coverImageUrl} alt="Prévia da capa do guia" className="h-44 w-full object-cover" /></div> : null}<div className="mt-6 flex flex-wrap items-center gap-3"><select value={guideForm.status} onChange={event => setGuideForm(current => ({ ...current, status: event.target.value as TestGuideForm["status"] }))} className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"><option value="draft">Salvar rascunho</option><option value="published">Publicar no teste</option></select><Button type="submit" disabled={saveTestGuide.isPending || uploadPdf.isPending || uploadCover.isPending} className="pressable h-11 rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]"><Save size={16} className="mr-2" />{saveTestGuide.isPending ? <Loader2 className="animate-spin" size={16} /> : "Salvar guia"}</Button></div></form></> : <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-5 text-sm leading-6 text-[var(--ink-soft)]">O cadastro de novos guias de teste está disponível apenas para o Admin Master.</div>}
        {testGuides.isLoading ? <div className="h-40 animate-pulse rounded-3xl bg-[var(--linen)]" /> : testGuides.data?.length ? <section><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]">Catálogo de demonstração</p><h2 className="display-font mt-2 text-3xl font-semibold">Guias cadastrados</h2></div><span className="text-xs font-bold text-[var(--ink-soft)]">{testGuides.data.length} {testGuides.data.length === 1 ? "item" : "itens"}</span></div><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{testGuides.data.map(guide => <article key={guide.id} className="soft-card overflow-hidden rounded-3xl"><div className="relative h-48" style={{ backgroundColor: guide.accentColor }}>{guide.coverImageUrl ? <img src={guide.coverImageUrl} alt={`Capa de ${guide.title}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-white/70"><BookOpen size={38} /></div>}<span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--sage-deep)]">{guide.status === "published" ? "Publicado" : "Rascunho"}</span></div><div className="p-5"><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">{guide.category}</span><h3 className="display-font mt-2 text-2xl font-semibold leading-tight">{guide.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">{guide.summary}</p>{guide.callout ? <p className="mt-3 border-l-2 border-[var(--clay)] pl-3 text-xs font-semibold leading-5 text-[var(--ink-soft)]">{guide.callout}</p> : null}<p className="mt-4 text-xs text-[var(--ink-soft)]">Atualizado em {formatDate(guide.updatedAt)}</p><div className="mt-5 flex flex-wrap gap-2">{guide.hasPdf ? <Button type="button" onClick={() => setSelectedGuideId(guide.id)} className="pressable rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"><Eye size={15} className="mr-2" />Ler PDF aqui</Button> : <span className="rounded-xl bg-[var(--linen)] px-3 py-2 text-xs font-bold text-[var(--ink-soft)]">PDF pendente</span>}{isMaster ? <Button type="button" variant="outline" onClick={() => setGuideForm({ id: guide.id, title: guide.title, summary: guide.summary, content: guide.content || "", category: guide.category, callout: guide.callout || "", accentColor: guide.accentColor, coverImageKey: guide.coverImageKey, coverImageUrl: guide.coverImageUrl, pdfKey: null, pdfUrl: null, status: guide.status })} className="rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]">Editar</Button> : null}</div></div></article>)}</div></section> : <ContentEmpty icon={BookOpen} title="Nenhum guia de teste ainda" text={isMaster ? "Cadastre o primeiro guia acima para revisar capa e PDF dentro do sistema." : "A administração ainda não publicou um guia de demonstração."} />}
        {selectedGuide?.hasPdf ? <section ref={readerRef} className="rounded-3xl border border-[var(--line)] bg-white p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Leitor interno protegido</p><h2 className="display-font mt-1 text-2xl font-semibold">{selectedGuide.title}</h2></div><div className="flex gap-2"><button type="button" onClick={() => readerRef.current?.requestFullscreen?.()} className="inline-flex items-center rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]"><Maximize2 size={14} className="mr-2" />Tela cheia</button><button type="button" onPointerDown={event => event.stopPropagation()} onClick={closeReader} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--ink-soft)] transition hover:bg-[var(--linen)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]" aria-label="Fechar leitor"><X size={22} strokeWidth={2} /></button></div></div><p className="mt-3 text-xs text-[var(--ink-soft)]">Este conteúdo é disponibilizado somente para leitura dentro da plataforma.</p><PdfReader src={`/api/protected-pdf/test-guide/${selectedGuide.id}`} title={selectedGuide.title} progressSource="testGuide" documentId={selectedGuide.id} /></section> : null}
      </div>}
    </section>
  </MemberShell>;
}
