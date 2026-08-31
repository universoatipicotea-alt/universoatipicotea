import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BookOpen, ChefHat, CheckCircle2, Eye, FileUp, ImageUp, Lightbulb, Loader2, MessageCircleMore, Save, ShieldAlert, SlidersHorizontal, UsersRound, X } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

const contentCategories = ["Rotina", "Comunicação", "Escola", "Comportamento", "Autocuidado", "Direitos", "Outros"];

type GuideForm = {
  id?: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  pdfKey: string | null;
  pdfUrl: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  status: "draft" | "published";
  position: number;
};
type FacilitatorForm = {
  id?: number;
  title: string;
  summary: string;
  category: string;
  sourceLabel: string;
  linkUrl: string;
  imageKey: string | null;
  imageUrl: string | null;
  status: "draft" | "published";
  position: number;
};

const newGuide = (): GuideForm => ({ title: "", summary: "", content: "", category: "Rotina", pdfKey: null, pdfUrl: null, coverImageKey: null, coverImageUrl: null, status: "draft", position: 0 });
type RecipeForm = {
  id?: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  callout: string;
  accentColor: string;
  pdfKey: string | null;
  pdfUrl: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  status: "draft" | "published";
};

const newRecipe = (): RecipeForm => ({ title: "", summary: "", content: "", category: "Rotina", callout: "", accentColor: "#0b2b26", pdfKey: null, pdfUrl: null, coverImageKey: null, coverImageUrl: null, status: "draft" });
const newFacilitator = (): FacilitatorForm => ({ title: "", summary: "", category: "Rotina", sourceLabel: "", linkUrl: "", imageKey: null, imageUrl: null, status: "draft", position: 0 });

async function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function statusLabel(status: "draft" | "published" | "visible" | "hidden") {
  return status === "published" || status === "visible" ? "Publicado" : status === "hidden" ? "Oculto" : "Rascunho";
}

function StatusPill({ status }: { status: "draft" | "published" | "visible" | "hidden" }) {
  const active = status === "published" || status === "visible";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] ${active ? "bg-[var(--sage-pale)] text-[var(--sage-deep)]" : status === "hidden" ? "bg-[#f5e7df] text-[#9c583c]" : "bg-[var(--lavender)] text-[#665d81]"}`}>{statusLabel(status)}</span>;
}

function Stat({ label, value, icon: Icon }: { label: string; value?: number; icon: typeof UsersRound }) {
  return <article className="soft-card rounded-2xl p-5"><Icon size={18} className="text-[var(--sage-deep)]" /><strong className="display-font mt-5 block text-4xl font-semibold">{value ?? 0}</strong><span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-soft)]">{label}</span></article>;
}

export default function Admin() {
  const { user, loading } = useAuth();
  const dashboard = trpc.community.admin.dashboard.useQuery(undefined, { enabled: ["admin", "master"].includes(user?.role || "") });
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<"overview" | "guides" | "recipes" | "facilitators" | "moderation">("overview");
  const [guideForm, setGuideForm] = useState<GuideForm>(newGuide());
  const [facilitatorForm, setFacilitatorForm] = useState<FacilitatorForm>(newFacilitator());
  const [recipeForm, setRecipeForm] = useState<RecipeForm>(newRecipe());
  const recipePdfInput = useRef<HTMLInputElement>(null);
  const recipeCoverInput = useRef<HTMLInputElement>(null);
  const recipes = trpc.community.admin.testGuides.useQuery(undefined, { enabled: ["admin", "master"].includes(user?.role || "") });
  const [detailTopicId, setDetailTopicId] = useState<number | null>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const facilitatorImageInput = useRef<HTMLInputElement>(null);
  const topicDetail = trpc.community.admin.topicDetail.useQuery({ topicId: detailTopicId ?? 1 }, { enabled: Boolean(detailTopicId) });

  const refreshContent = async () => {
    await Promise.all([utils.community.admin.dashboard.invalidate(), utils.community.landing.invalidate(), utils.community.memberDashboard.invalidate()]);
  };
  const saveGuide = trpc.community.admin.saveGuide.useMutation({ onSuccess: async () => { await refreshContent(); setGuideForm(newGuide()); toast.success("Guia salvo com sucesso."); }, onError: error => toast.error(error.message) });
  const saveFacilitator = trpc.community.admin.saveFacilitator.useMutation({ onSuccess: async () => { await refreshContent(); setFacilitatorForm(newFacilitator()); toast.success("Facilitador salvo com sucesso."); }, onError: error => toast.error(error.message) });
  const moderateTopic = trpc.community.admin.moderateTopic.useMutation({ onSuccess: async () => { await refreshContent(); if (detailTopicId) await utils.community.admin.topicDetail.invalidate({ topicId: detailTopicId }); toast.success("Visibilidade do tópico atualizada."); }, onError: error => toast.error(error.message) });
  const moderateComment = trpc.community.admin.moderateComment.useMutation({ onSuccess: async () => { if (detailTopicId) await utils.community.admin.topicDetail.invalidate({ topicId: detailTopicId }); await refreshContent(); toast.success("Visibilidade do comentário atualizada."); }, onError: error => toast.error(error.message) });
  const uploadPdf = trpc.community.files.uploadGuidePdf.useMutation({ onSuccess: result => { setGuideForm(current => ({ ...current, pdfKey: result.key, pdfUrl: result.url })); toast.success("PDF carregado. Salve o guia para publicar a alteração."); }, onError: error => toast.error(error.message) });
  const uploadContentImage = trpc.community.files.uploadContentImage.useMutation({ onError: error => toast.error(error.message) });
  const saveRecipe = trpc.community.admin.saveTestGuide.useMutation({ onSuccess: async () => { await Promise.all([refreshContent(), utils.community.admin.testGuides.invalidate(), utils.community.publicAcademiaGuides.invalidate()]); setRecipeForm(newRecipe()); toast.success("Receita salva com sucesso."); }, onError: error => toast.error(error.message) });

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>, kind: "pdf" | "guideImage" | "facilitatorImage" | "recipePdf" | "recipeImage") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rules = kind === "pdf" || kind === "recipePdf" ? { accepted: ["application/pdf"], max: 12 * 1024 * 1024, name: "PDF" } : { accepted: ["image/jpeg", "image/png", "image/webp"], max: 6 * 1024 * 1024, name: "imagem JPG, PNG ou WEBP" };
    if (!rules.accepted.includes(file.type)) { toast.error(`Envie um arquivo ${rules.name}.`); return; }
    if (file.size > rules.max) { toast.error(`${rules.name === "PDF" ? "O PDF" : "A imagem"} excede o tamanho permitido.`); return; }
    const dataUrl = await readAsDataUrl(file);
    if (kind === "pdf") { await uploadPdf.mutateAsync({ fileName: file.name, dataUrl }); }
    else if (kind === "recipePdf") {
      const result = await uploadPdf.mutateAsync({ fileName: file.name, dataUrl });
      setRecipeForm(current => ({ ...current, pdfKey: result.key, pdfUrl: result.url }));
      toast.success("PDF da receita carregado. Salve para publicar.");
    }
    else {
      const result = await uploadContentImage.mutateAsync({ fileName: file.name, dataUrl });
      if (kind === "guideImage") setGuideForm(current => ({ ...current, coverImageKey: result.key, coverImageUrl: result.url }));
      else if (kind === "recipeImage") setRecipeForm(current => ({ ...current, coverImageKey: result.key, coverImageUrl: result.url }));
      else setFacilitatorForm(current => ({ ...current, imageKey: result.key, imageUrl: result.url }));
      toast.success("Imagem carregada. Salve o conteúdo para confirmar a alteração.");
    }
    event.target.value = "";
  };

  const submitGuide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveGuide.mutateAsync({ ...guideForm, content: guideForm.content || null });
  };
  const submitRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveRecipe.mutateAsync({ ...recipeForm, content: recipeForm.content || null, callout: recipeForm.callout || null });
  };
  const submitFacilitator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveFacilitator.mutateAsync({ ...facilitatorForm, sourceLabel: facilitatorForm.sourceLabel || null, linkUrl: facilitatorForm.linkUrl || null });
  };

  if (loading) return <div className="min-h-screen bg-[var(--paper)]" />;
  if (!["admin", "master"].includes(user?.role || "")) {
    return <MemberShell eyebrow="Administração" title="Acesso restrito" description="Esta área está disponível apenas para administradores da comunidade."><ContentEmpty icon={ShieldAlert} title="Você não tem acesso a esta área" text="Caso acredite que isso esteja incorreto, fale com a administração do Universo Atípico." /></MemberShell>;
  }
  if (dashboard.isError) {
    return <MemberShell eyebrow="Administração" title="Centro de gestão" description="Não foi possível carregar os dados administrativos."><ContentEmpty icon={ShieldAlert} title="A administração não abriu desta vez" text="Tente atualizar a página. Nenhuma ação de conteúdo ou moderação foi realizada." /></MemberShell>;
  }
  const data = dashboard.data;

  const editGuide = (guide: NonNullable<typeof data>["guides"][number]) => {
    setGuideForm({ id: guide.id, title: guide.title, summary: guide.summary, content: guide.content || "", category: guide.category, pdfKey: guide.pdfKey, pdfUrl: guide.pdfUrl, coverImageKey: guide.coverImageKey, coverImageUrl: guide.coverImageUrl, status: guide.status, position: guide.position });
    setTab("guides");
  };
  const editFacilitator = (item: NonNullable<typeof data>["facilitators"][number]) => {
    setFacilitatorForm({ id: item.id, title: item.title, summary: item.summary, category: item.category, sourceLabel: item.sourceLabel || "", linkUrl: item.linkUrl || "", imageKey: item.imageKey, imageUrl: item.imageUrl, status: item.status, position: item.position });
    setTab("facilitators");
  };

  const tabs: { id: typeof tab; label: string; icon: typeof SlidersHorizontal }[] = [
    { id: "overview", label: "Visão geral", icon: SlidersHorizontal },
    { id: "guides", label: "Guias", icon: BookOpen },
    { id: "recipes", label: "Receitas", icon: ChefHat },
    { id: "facilitators", label: "Facilitadores", icon: Lightbulb },
    { id: "moderation", label: "Moderação", icon: ShieldAlert },
  ];

  return <MemberShell eyebrow="Administração" title="Centro de gestão" description="Publique recursos, organize conteúdos e preserve um espaço de conversa respeitoso.">
    <div className="mb-9 flex gap-2 overflow-x-auto border-b border-[var(--line)] pb-3">{tabs.map(item => { const Icon = item.icon; const active = tab === item.id; return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`nav-link inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold ${active ? "bg-[var(--sage-deep)] text-white" : "bg-white text-[var(--ink-soft)] hover:bg-[var(--linen)] hover:text-[var(--ink)]"}`}><Icon size={15} />{item.label}</button>; })}</div>

    {dashboard.isLoading ? <div className="grid gap-4 md:grid-cols-4"><div className="h-36 animate-pulse rounded-2xl bg-[var(--linen)]" /><div className="h-36 animate-pulse rounded-2xl bg-[var(--linen)]" /><div className="h-36 animate-pulse rounded-2xl bg-[var(--linen)]" /><div className="h-36 animate-pulse rounded-2xl bg-[var(--linen)]" /></div> : null}

    {tab === "overview" && data ? <section><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="membros" value={data.stats.members} icon={UsersRound} /><Stat label="guias" value={data.stats.guides} icon={BookOpen} /><Stat label="facilitadores" value={data.stats.facilitators} icon={Lightbulb} /><Stat label="interações" value={data.stats.conversations} icon={MessageCircleMore} /></div><div className="mt-12 grid gap-5 lg:grid-cols-2"><article className="rounded-3xl bg-[var(--sage-deep)] p-7 text-white"><BookOpen size={20} className="text-[#ecd09e]" /><h2 className="display-font mt-5 text-3xl font-semibold leading-none">Publicar com intenção.</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/75">Crie guias e facilitadores sempre que houver algo útil, confiável e bem contextualizado para compartilhar.</p><Button onClick={() => setTab("guides")} className="pressable mt-6 rounded-xl bg-white font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]">Gerenciar guias</Button></article><article className="soft-card rounded-3xl p-7"><ShieldAlert size={20} className="text-[var(--sage-deep)]" /><h2 className="display-font mt-5 text-3xl font-semibold leading-none">Cuidar das conversas.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[var(--ink-soft)]">Use a moderação para ocultar conteúdos que deixem de ser adequados para o espaço comunitário.</p><Button variant="outline" onClick={() => setTab("moderation")} className="pressable mt-6 rounded-xl border-[var(--line)] bg-white font-extrabold text-[var(--sage-deep)]">Abrir moderação</Button></article></div></section> : null}

    {tab === "guides" && data ? <section className="grid gap-8 xl:grid-cols-[.95fr_1.05fr]"><form onSubmit={submitGuide} className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]">{guideForm.id ? "Editar guia" : "Novo guia"}</p><h2 className="display-font mt-2 text-3xl font-semibold">Biblioteca da comunidade</h2></div>{guideForm.id ? <button type="button" onClick={() => setGuideForm(newGuide())} className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-[var(--linen)]" aria-label="Cancelar edição"><X size={18} /></button> : null}</div><div className="mt-7 space-y-4"><div><Label htmlFor="guide-title" className="text-sm font-extrabold">Título</Label><Input id="guide-title" value={guideForm.title} onChange={event => setGuideForm(current => ({ ...current, title: event.target.value }))} minLength={4} maxLength={180} className="mt-2 h-11 rounded-xl border-[var(--line)]" required /></div><div className="grid gap-4 sm:grid-cols-[1fr_120px]"><div><Label htmlFor="guide-category" className="text-sm font-extrabold">Tema</Label><select id="guide-category" value={guideForm.category} onChange={event => setGuideForm(current => ({ ...current, category: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm">{contentCategories.map(category => <option key={category}>{category}</option>)}</select></div><div><Label htmlFor="guide-position" className="text-sm font-extrabold">Ordem</Label><Input id="guide-position" type="number" min={0} max={9999} value={guideForm.position} onChange={event => setGuideForm(current => ({ ...current, position: Number(event.target.value) || 0 }))} className="mt-2 h-11 rounded-xl border-[var(--line)]" /></div></div><div><Label htmlFor="guide-summary" className="text-sm font-extrabold">Resumo</Label><Textarea id="guide-summary" value={guideForm.summary} onChange={event => setGuideForm(current => ({ ...current, summary: event.target.value }))} minLength={12} maxLength={1200} className="mt-2 min-h-24 rounded-xl border-[var(--line)]" required /></div><div><Label htmlFor="guide-content" className="text-sm font-extrabold">Apresentação <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label><Textarea id="guide-content" value={guideForm.content} onChange={event => setGuideForm(current => ({ ...current, content: event.target.value }))} maxLength={12000} placeholder="Contextualize o material antes do download." className="mt-2 min-h-28 rounded-xl border-[var(--line)]" /></div><input ref={pdfInput} type="file" accept="application/pdf" className="sr-only" onChange={event => uploadFile(event, "pdf")} /><input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => uploadFile(event, "guideImage")} /><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => pdfInput.current?.click()} disabled={uploadPdf.isPending} className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-left hover:bg-[var(--linen)]"><FileUp size={18} className="text-[var(--sage-deep)]" /><strong className="mt-3 block text-xs">{guideForm.pdfKey ? "PDF carregado" : "Adicionar PDF"}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">Até 12 MB</span></button><button type="button" onClick={() => coverInput.current?.click()} disabled={uploadContentImage.isPending} className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-left hover:bg-[var(--linen)]"><ImageUp size={18} className="text-[var(--sage-deep)]" /><strong className="mt-3 block text-xs">{guideForm.coverImageKey ? "Capa carregada" : "Adicionar capa"}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">JPG, PNG ou WEBP</span></button></div><div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"><select value={guideForm.status} onChange={event => setGuideForm(current => ({ ...current, status: event.target.value as GuideForm["status"] }))} className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold"><option value="draft">Salvar como rascunho</option><option value="published">Publicar para membros</option></select><Button disabled={saveGuide.isPending} className="pressable rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]"><Save size={16} className="mr-2" />{saveGuide.isPending ? "Salvando..." : guideForm.id ? "Salvar alterações" : "Salvar guia"}</Button></div></div></form><div><SectionHeading label="Conteúdos cadastrados" title="Guias" />{data.guides.length ? <div className="space-y-3">{data.guides.map(guide => <article key={guide.id} className="soft-card rounded-2xl p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusPill status={guide.status} /><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">{guide.category}</span></div><h3 className="display-font mt-3 text-2xl font-semibold leading-none">{guide.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--ink-soft)]">{guide.summary}</p></div><Button variant="outline" onClick={() => editGuide(guide)} className="pressable shrink-0 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]">Editar</Button></div></article>)}</div> : <ContentEmpty icon={BookOpen} title="Nenhum guia cadastrado" text="Use o formulário para criar o primeiro material da biblioteca." />}</div></section> : null}

    {tab === "recipes" ? <section className="grid gap-8 xl:grid-cols-[.95fr_1.05fr]"><form onSubmit={submitRecipe} className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]">{recipeForm.id ? "Editar receita" : "Nova receita"}</p><h2 className="display-font mt-2 text-3xl font-semibold">Receitas em PDF</h2></div>{recipeForm.id ? <button type="button" onClick={() => setRecipeForm(newRecipe())} className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-[var(--linen)]" aria-label="Cancelar edição"><X size={18} /></button> : null}</div><div className="mt-7 space-y-4"><div><Label htmlFor="recipe-title" className="text-sm font-extrabold">Título</Label><Input id="recipe-title" value={recipeForm.title} onChange={event => setRecipeForm(current => ({ ...current, title: event.target.value }))} minLength={4} maxLength={180} className="mt-2 h-11 rounded-xl border-[var(--line)]" required /></div><div><Label htmlFor="recipe-category" className="text-sm font-extrabold">Tema</Label><select id="recipe-category" value={recipeForm.category} onChange={event => setRecipeForm(current => ({ ...current, category: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm">{contentCategories.map(category => <option key={category}>{category}</option>)}</select></div><div><Label htmlFor="recipe-summary" className="text-sm font-extrabold">Resumo</Label><Textarea id="recipe-summary" value={recipeForm.summary} onChange={event => setRecipeForm(current => ({ ...current, summary: event.target.value }))} minLength={12} maxLength={1200} className="mt-2 min-h-24 rounded-xl border-[var(--line)]" required /></div><div><Label htmlFor="recipe-callout" className="text-sm font-extrabold">Destaque da capa <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label><Input id="recipe-callout" value={recipeForm.callout} onChange={event => setRecipeForm(current => ({ ...current, callout: event.target.value }))} maxLength={120} className="mt-2 h-11 rounded-xl border-[var(--line)]" /></div><input ref={recipePdfInput} type="file" accept="application/pdf" className="sr-only" onChange={event => uploadFile(event, "recipePdf")} /><input ref={recipeCoverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => uploadFile(event, "recipeImage")} /><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => recipePdfInput.current?.click()} disabled={uploadPdf.isPending} className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-left hover:bg-[var(--linen)]"><FileUp size={18} className="text-[var(--sage-deep)]" /><strong className="mt-3 block text-xs">{recipeForm.pdfKey ? "PDF carregado" : "Adicionar PDF da receita"}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">Até 12 MB</span></button><button type="button" onClick={() => recipeCoverInput.current?.click()} disabled={uploadContentImage.isPending} className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-left hover:bg-[var(--linen)]"><ImageUp size={18} className="text-[var(--sage-deep)]" /><strong className="mt-3 block text-xs">{recipeForm.coverImageKey ? "Capa carregada" : "Adicionar capa"}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">JPG, PNG ou WEBP</span></button></div><div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"><select value={recipeForm.status} onChange={event => setRecipeForm(current => ({ ...current, status: event.target.value as RecipeForm["status"] }))} className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold"><option value="draft">Salvar como rascunho</option><option value="published">Publicar para membros</option></select><Button disabled={saveRecipe.isPending} className="pressable rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]"><Save size={16} className="mr-2" />{saveRecipe.isPending ? "Salvando..." : recipeForm.id ? "Salvar alterações" : "Salvar receita"}</Button></div></div></form><div><SectionHeading label="Conteúdos cadastrados" title="Receitas" />{recipes.data?.length ? <div className="space-y-3">{recipes.data.map(recipe => <article key={recipe.id} className="soft-card rounded-2xl p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusPill status={recipe.status} /><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">{recipe.category}</span>{recipe.pdfKey ? <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[var(--sage-deep)]"><CheckCircle2 size={12} />PDF</span> : null}</div><h3 className="display-font mt-3 text-2xl font-semibold leading-none">{recipe.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--ink-soft)]">{recipe.summary}</p></div><Button variant="outline" onClick={() => setRecipeForm({ id: recipe.id, title: recipe.title, summary: recipe.summary, content: recipe.content || "", category: recipe.category, callout: recipe.callout || "", accentColor: recipe.accentColor || "#0b2b26", pdfKey: recipe.pdfKey, pdfUrl: recipe.pdfUrl, coverImageKey: recipe.coverImageKey, coverImageUrl: recipe.coverImageUrl, status: recipe.status })} className="pressable shrink-0 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]">Editar</Button></div></article>)}</div> : recipes.isLoading ? <div className="h-48 animate-pulse rounded-2xl bg-[var(--linen)]" /> : <ContentEmpty icon={ChefHat} title="Nenhuma receita cadastrada" text="Use o formulário para publicar a primeira receita em PDF." />}</div></section> : null}

    {tab === "facilitators" && data ? <section className="grid gap-8 xl:grid-cols-[.95fr_1.05fr]"><form onSubmit={submitFacilitator} className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]">{facilitatorForm.id ? "Editar facilitador" : "Novo facilitador"}</p><h2 className="display-font mt-2 text-3xl font-semibold">Seleção da rotina</h2></div>{facilitatorForm.id ? <button type="button" onClick={() => setFacilitatorForm(newFacilitator())} className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-[var(--linen)]" aria-label="Cancelar edição"><X size={18} /></button> : null}</div><div className="mt-7 space-y-4"><div><Label htmlFor="fac-title" className="text-sm font-extrabold">Título</Label><Input id="fac-title" value={facilitatorForm.title} onChange={event => setFacilitatorForm(current => ({ ...current, title: event.target.value }))} minLength={4} maxLength={180} className="mt-2 h-11 rounded-xl border-[var(--line)]" required /></div><div className="grid gap-4 sm:grid-cols-[1fr_120px]"><div><Label htmlFor="fac-category" className="text-sm font-extrabold">Tema</Label><select id="fac-category" value={facilitatorForm.category} onChange={event => setFacilitatorForm(current => ({ ...current, category: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm">{contentCategories.map(category => <option key={category}>{category}</option>)}</select></div><div><Label htmlFor="fac-position" className="text-sm font-extrabold">Ordem</Label><Input id="fac-position" type="number" min={0} max={9999} value={facilitatorForm.position} onChange={event => setFacilitatorForm(current => ({ ...current, position: Number(event.target.value) || 0 }))} className="mt-2 h-11 rounded-xl border-[var(--line)]" /></div></div><div><Label htmlFor="fac-summary" className="text-sm font-extrabold">Por que este recurso está aqui?</Label><Textarea id="fac-summary" value={facilitatorForm.summary} onChange={event => setFacilitatorForm(current => ({ ...current, summary: event.target.value }))} minLength={12} maxLength={1200} className="mt-2 min-h-28 rounded-xl border-[var(--line)]" required /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="fac-source" className="text-sm font-extrabold">Nome da fonte <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label><Input id="fac-source" value={facilitatorForm.sourceLabel} onChange={event => setFacilitatorForm(current => ({ ...current, sourceLabel: event.target.value }))} maxLength={80} className="mt-2 h-11 rounded-xl border-[var(--line)]" /></div><div><Label htmlFor="fac-link" className="text-sm font-extrabold">Link externo <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label><Input id="fac-link" type="url" value={facilitatorForm.linkUrl} onChange={event => setFacilitatorForm(current => ({ ...current, linkUrl: event.target.value }))} placeholder="https://" className="mt-2 h-11 rounded-xl border-[var(--line)]" /></div></div><input ref={facilitatorImageInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => uploadFile(event, "facilitatorImage")} /><button type="button" onClick={() => facilitatorImageInput.current?.click()} disabled={uploadContentImage.isPending} className="w-full rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-left hover:bg-[var(--linen)]"><ImageUp size={18} className="text-[var(--sage-deep)]" /><strong className="mt-3 block text-xs">{facilitatorForm.imageKey ? "Imagem carregada" : "Adicionar imagem"}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">JPG, PNG ou WEBP, até 6 MB</span></button><div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"><select value={facilitatorForm.status} onChange={event => setFacilitatorForm(current => ({ ...current, status: event.target.value as FacilitatorForm["status"] }))} className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold"><option value="draft">Salvar como rascunho</option><option value="published">Publicar para membros</option></select><Button disabled={saveFacilitator.isPending} className="pressable rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]"><Save size={16} className="mr-2" />{saveFacilitator.isPending ? "Salvando..." : facilitatorForm.id ? "Salvar alterações" : "Salvar facilitador"}</Button></div></div></form><div><SectionHeading label="Referências cadastradas" title="Facilitadores" />{data.facilitators.length ? <div className="space-y-3">{data.facilitators.map(item => <article key={item.id} className="soft-card rounded-2xl p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusPill status={item.status} /><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">{item.category}</span></div><h3 className="display-font mt-3 text-2xl font-semibold leading-none">{item.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--ink-soft)]">{item.summary}</p></div><Button variant="outline" onClick={() => editFacilitator(item)} className="pressable shrink-0 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]">Editar</Button></div></article>)}</div> : <ContentEmpty icon={Lightbulb} title="Nenhum facilitador cadastrado" text="Use o formulário para criar a primeira referência selecionada." />}</div></section> : null}

    {tab === "moderation" && data ? <section><SectionHeading label="Convivência" title="Tópicos e comentários" /><p className="-mt-3 mb-6 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">Oculte conteúdos quando for necessário para preservar uma comunidade respeitosa. O histórico permanece disponível somente na administração.</p>{data.topics.length ? <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white">{data.topics.map(topic => <article key={topic.id} className="flex flex-col gap-4 border-b border-[var(--line)] p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusPill status={topic.status} /><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">{topic.category}</span></div><h3 className="mt-2 truncate text-sm font-extrabold">{topic.title}</h3><p className="mt-1 text-xs text-[var(--ink-soft)]">{topic.authorDisplayName || topic.authorName || "Membro"} · {topic.commentCount} comentários</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" onClick={() => setDetailTopicId(topic.id)} className="pressable rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]"><Eye size={15} className="mr-1.5" />Revisar</Button><Button variant="outline" onClick={() => moderateTopic.mutate({ topicId: topic.id, status: topic.status === "visible" ? "hidden" : "visible" })} disabled={moderateTopic.isPending} className="pressable rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--ink)]">{topic.status === "visible" ? "Ocultar" : "Restaurar"}</Button></div></article>)}</div> : <ContentEmpty icon={ShieldAlert} title="Nenhum tópico para moderar" text="Quando houver conversas na comunidade, elas aparecerão aqui para acompanhamento." />}</section> : null}

    <Dialog open={detailTopicId !== null} onOpenChange={open => { if (!open) setDetailTopicId(null); }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border-[var(--line)] bg-[var(--paper)]"><DialogHeader><DialogTitle className="display-font text-3xl font-semibold">Revisar conversa</DialogTitle><DialogDescription>Use esta área para analisar o tópico e cada comentário individualmente.</DialogDescription></DialogHeader>{topicDetail.isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-[var(--linen)]" /> : topicDetail.data ? <div className="mt-2"><article className="rounded-2xl bg-white p-5"><div className="flex items-center justify-between gap-3"><StatusPill status={topicDetail.data.topic.status} /><Button variant="outline" onClick={() => moderateTopic.mutate({ topicId: topicDetail.data!.topic.id, status: topicDetail.data!.topic.status === "visible" ? "hidden" : "visible" })} className="pressable rounded-xl border-[var(--line)] bg-white text-xs font-extrabold">{topicDetail.data.topic.status === "visible" ? "Ocultar tópico" : "Restaurar tópico"}</Button></div><h3 className="display-font mt-4 text-3xl font-semibold leading-none">{topicDetail.data.topic.title}</h3><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-soft)]">{topicDetail.data.topic.body}</p></article><div className="mt-6"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Comentários</p><div className="mt-3 space-y-3">{topicDetail.data.comments.length ? topicDetail.data.comments.map(comment => <article key={comment.id} className="rounded-2xl border border-[var(--line)] bg-white p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-extrabold">{comment.authorDisplayName || comment.authorName || "Membro"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">{comment.body}</p></div><div className="shrink-0 text-right"><StatusPill status={comment.status} /><Button variant="outline" onClick={() => moderateComment.mutate({ commentId: comment.id, status: comment.status === "visible" ? "hidden" : "visible" })} className="pressable mt-3 rounded-xl border-[var(--line)] bg-white text-[11px] font-extrabold">{comment.status === "visible" ? "Ocultar" : "Restaurar"}</Button></div></div></article>) : <p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-sm text-[var(--ink-soft)]">Ainda não há comentários nesta conversa.</p>}</div></div></div> : <ContentEmpty icon={MessageCircleMore} title="Conversa indisponível" text="Este tópico não está mais disponível para revisão." />}</DialogContent></Dialog>
  </MemberShell>;
}
