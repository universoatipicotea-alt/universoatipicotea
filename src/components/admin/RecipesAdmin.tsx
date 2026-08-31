import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { call, trpc } from "@/lib/trpc";
import { renderPdfCoverFromFile, renderPdfCoverFromUrl } from "@/lib/pdf-thumbnail";
import { RECIPE_CATEGORIES } from "@/lib/recipe-categories";
import { StatusPill } from "@/components/ds";

import {
  Archive,
  ChefHat,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { DragEvent, FormEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Status = "draft" | "published" | "archived";

type RecipeRow = {
  id: number;
  title: string;
  summary: string;
  content: string | null;
  category: string;
  callout: string | null;
  accentColor: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  pdfKey: string | null;
  pdfUrl: string | null;
  status: Status;
  updatedAt: string;
};

type RecipeForm = {
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
  pdfName: string | null;
  status: Status;
};

const emptyForm = (): RecipeForm => ({
  title: "",
  summary: "",
  content: "",
  category: RECIPE_CATEGORIES[0],
  callout: "",
  accentColor: "#0b2b26",
  coverImageKey: null,
  coverImageUrl: null,
  pdfKey: null,
  pdfUrl: null,
  pdfName: null,
  status: "draft",
});

async function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function uploadWithProgress(url: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("content-type", file.type || "application/pdf");
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => (request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Falha no envio do PDF.")));
    request.onerror = () => reject(new Error("Falha no envio do PDF."));
    request.send(file);
  });
}

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function RecipesAdmin({ enabled }: { enabled: boolean }) {
  const utils = trpc.useUtils();
  const recipes = trpc.community.admin.testGuides.useQuery(undefined, { enabled });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RecipeForm>(emptyForm());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sort, setSort] = useState<"recent" | "title">("recent");
  const [coverBusy, setCoverBusy] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [migrating, setMigrating] = useState(false);

  const coverInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    await Promise.all([
      utils.community.admin.testGuides.invalidate(),
      utils.community.publicAcademiaGuides.invalidate(),
      utils.community.memberDashboard.invalidate(),
      utils.community.landing.invalidate(),
    ]);
  };

  const save = trpc.community.admin.saveTestGuide.useMutation({
    onSuccess: async () => {
      await refresh();
      setOpen(false);
      setForm(emptyForm());
      toast.success("Receita salva.");
    },
    onError: error => toast.error(error.message),
  });
  const setContentStatus = trpc.community.admin.setContentStatus.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Situação atualizada.");
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.community.admin.deleteContent.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Receita excluída.");
    },
    onError: error => toast.error(error.message),
  });
  const uploadImage = trpc.community.files.uploadContentImage.useMutation();
  const signedPdf = trpc.community.files.signedPdfUpload.useMutation();
  const updateCover = trpc.community.admin.updateContentCover.useMutation();


  const rows = (recipes.data ?? []) as RecipeRow[];
  const list = useMemo(() => {
    const term = query.toLocaleLowerCase("pt-BR").trim();
    const filtered = rows.filter(row => {
      const matchesTerm = !term || `${row.title} ${row.summary}`.toLocaleLowerCase("pt-BR").includes(term);
      const matchesCategory = category === "Todas" || (row.category || "") === category;
      const matchesStatus = status === "all" || row.status === status;
      return matchesTerm && matchesCategory && matchesStatus;
    });
    return filtered.sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title, "pt-BR") : (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    );
  }, [rows, query, category, status, sort]);

  const publishedCount = rows.filter(row => row.status === "published").length;

  const openNew = () => {
    setForm(emptyForm());
    setOpen(true);
  };
  const openEdit = (row: RecipeRow) => {
    setForm({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content || "",
      category: RECIPE_CATEGORIES.includes(row.category) ? row.category : "Outros",
      callout: row.callout || "",
      accentColor: row.accentColor || "#0b2b26",
      coverImageKey: row.coverImageKey,
      coverImageUrl: row.coverImageUrl,
      pdfKey: row.pdfKey,
      pdfUrl: row.pdfUrl,
      pdfName: row.pdfKey ? row.pdfKey.split("/").pop() || null : null,
      status: row.status,
    });
    setOpen(true);
  };

  const handleCover = async (file?: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Envie uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("A imagem excede 6 MB.");
      return;
    }
    setCoverBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const result = await uploadImage.mutateAsync({ fileName: file.name, dataUrl });
      setForm(current => ({ ...current, coverImageKey: result.key, coverImageUrl: result.url }));
      toast.success("Capa carregada.");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível enviar a capa.");
    } finally {
      setCoverBusy(false);
    }
  };

  /** Gera a capa a partir da página 1 do PDF e envia para o armazenamento. */
  const generateCoverFromPdf = async (source: File | number, baseName: string) => {
    let thumbnail;
    if (typeof source === "number") {
      const resolved = (await call("community.pdfSource", { sourceType: "testGuide", documentId: source })) as { url: string };
      thumbnail = await renderPdfCoverFromUrl(resolved.url);
    } else {
      thumbnail = await renderPdfCoverFromFile(source);
    }
    const fileName = `${baseName.replace(/\.pdf$/i, "") || "capa"}-capa.${thumbnail.extension}`;
    return uploadImage.mutateAsync({ fileName, dataUrl: thumbnail.dataUrl });
  };

  const handlePdf = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("O PDF excede 50 MB.");
      return;
    }
    setPdfProgress(0);
    try {
      const target = await signedPdf.mutateAsync({ fileName: file.name });
      await uploadWithProgress(target.signedUrl, file, setPdfProgress);
      setForm(current => ({ ...current, pdfKey: target.key, pdfUrl: target.url, pdfName: file.name }));
      toast.success("PDF carregado.");
      setCoverBusy(true);
      try {
        const cover = await generateCoverFromPdf(file, file.name);
        setForm(current => ({ ...current, coverImageKey: cover.key, coverImageUrl: cover.url }));
        toast.success("Capa gerada a partir da primeira página.");
      } catch {
        toast.error("O PDF foi enviado, mas não foi possível gerar a capa automaticamente.");
      } finally {
        setCoverBusy(false);
      }
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível enviar o PDF.");
    } finally {
      setPdfProgress(null);
    }
  };

  /** Regenera a capa de materiais existentes usando a página 1 do PDF salvo. */
  const regenerateCovers = async () => {
    const targets = rows.filter(row => row.pdfKey);
    if (!targets.length) {
      toast.error("Nenhum material com PDF para processar.");
      return;
    }
    setMigrating(true);
    let done = 0;
    for (const row of targets) {
      try {
        const cover = await generateCoverFromPdf(row.id, row.title);
        await updateCover.mutateAsync({ kind: "recipe", id: row.id, coverImageKey: cover.key, coverImageUrl: cover.url });
        done += 1;
      } catch {
        /* segue para o próximo material */
      }
    }
    setMigrating(false);
    await refresh();
    toast[done ? "success" : "error"](
      done ? `${done} de ${targets.length} capas regeneradas.` : "Não foi possível regenerar as capas.",
    );
  };


  const dropHandler = (handler: (file?: File | null) => void) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handler(event.dataTransfer.files?.[0]);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await save.mutateAsync({
      id: form.id,
      title: form.title,
      summary: form.summary,
      content: form.content || null,
      category: form.category,
      callout: form.callout || null,
      accentColor: form.accentColor,
      coverImageKey: form.coverImageKey,
      coverImageUrl: form.coverImageUrl,
      pdfKey: form.pdfKey,
      pdfUrl: form.pdfUrl,
      status: form.status,
    });
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--sage)]">Conteúdo</p>
          <h2 className="display-font mt-2 text-3xl font-semibold">Receitas</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Crie, organize e publique conteúdos de alimentação.</p>
          <p className="mt-1 text-xs font-bold text-[var(--ink-soft)]">
            {rows.length} cadastradas · {publishedCount} publicadas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={regenerateCovers}
            disabled={migrating}
            className="rounded-xl text-xs font-extrabold"
          >
            {migrating ? <Loader2 size={15} className="mr-2 animate-spin" /> : <RefreshCw size={15} className="mr-2" />}
            Regenerar capas dos PDFs
          </Button>
          <Button type="button" onClick={openNew} className="pressable rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white">
            <Plus size={15} className="mr-2" /> Nova receita
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={15} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por título ou resumo"
            aria-label="Buscar receitas"
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--sage)]"
          />
        </label>
        <select
          value={category}
          onChange={event => setCategory(event.target.value)}
          aria-label="Filtrar por categoria"
          className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
        >
          {["Todas", ...RECIPE_CATEGORIES].map(item => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={event => setStatus(event.target.value as any)}
          aria-label="Filtrar por situação"
          className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
        >
          <option value="all">Todas as situações</option>
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
          <option value="archived">Arquivado</option>
        </select>
        <select
          value={sort}
          onChange={event => setSort(event.target.value as any)}
          aria-label="Ordenar"
          className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
        >
          <option value="recent">Mais recentes</option>
          <option value="title">Título (A-Z)</option>
        </select>
      </div>

      {recipes.isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-[var(--linen)]" />
          ))}
        </div>
      ) : recipes.isError ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--ink-soft)]">
          Não foi possível carregar as receitas agora.
        </div>
      ) : list.length ? (
        <div className="mt-6 space-y-3">
          {list.map(row => (
            <article key={row.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4">
              <div className="grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--linen)] p-1">
                {row.coverImageUrl ? (
                  <img src={row.coverImageUrl} alt={`Capa de ${row.title}`} loading="lazy" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="grid h-full place-items-center text-[var(--ink-soft)]">
                    <ImageIcon size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={row.status} />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">{row.category}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--ink-soft)]">
                    <FileText size={12} /> {row.pdfKey ? "PDF" : "Texto"}
                  </span>
                </div>
                <h3 className="display-font mt-1 text-xl font-semibold leading-tight">{row.title}</h3>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Atualizado em {formatDate(row.updatedAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/receitas?guide=${row.id}`}
                  className="inline-flex items-center rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]"
                >
                  <Eye size={14} className="mr-1.5" /> Visualizar
                </a>
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="inline-flex items-center rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]"
                >
                  <Pencil size={14} className="mr-1.5" /> Editar
                </button>
                <button
                  type="button"
                  disabled={setContentStatus.isPending}
                  onClick={() =>
                    setContentStatus.mutate({ kind: "recipe", id: row.id, status: row.status === "published" ? "draft" : "published" })
                  }
                  className="inline-flex items-center rounded-xl bg-[var(--sage-deep)] px-3 py-2 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
                >
                  {row.status === "published" ? "Despublicar" : "Publicar"}
                </button>
                <button
                  type="button"
                  disabled={setContentStatus.isPending}
                  onClick={() => setContentStatus.mutate({ kind: "recipe", id: row.id, status: row.status === "archived" ? "draft" : "archived" })}
                  className="inline-flex items-center rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-extrabold text-[#9c583c] hover:bg-[#fdf3ee]"
                >
                  <Archive size={14} className="mr-1.5" /> {row.status === "archived" ? "Restaurar" : "Arquivar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Excluir definitivamente "${row.title}"?`)) remove.mutate({ kind: "recipe", id: row.id });
                  }}
                  className="inline-flex items-center rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-extrabold text-[#9c583c] hover:bg-[#fdf3ee]"
                  aria-label={`Excluir ${row.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-white p-10 text-center">
          <ChefHat size={22} className="mx-auto text-[var(--sage)]" />
          <p className="display-font mt-3 text-2xl font-semibold">Nenhuma receita encontrada</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Ajuste os filtros ou crie uma nova receita.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl border-[var(--line)] bg-[var(--paper)]">
          <DialogHeader>
            <DialogTitle className="display-font text-3xl font-semibold">{form.id ? "Editar receita" : "Nova receita"}</DialogTitle>
            <DialogDescription>Preencha as informações, envie os arquivos e escolha a situação de publicação.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-7">
            <fieldset className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <legend className="px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Informações</legend>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipe-title" className="text-sm font-extrabold">Título</Label>
                  <Input
                    id="recipe-title"
                    value={form.title}
                    onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                    minLength={4}
                    maxLength={180}
                    required
                    className="mt-2 h-11 rounded-xl border-[var(--line)]"
                  />
                </div>
                <div>
                  <Label htmlFor="recipe-summary" className="text-sm font-extrabold">Resumo</Label>
                  <Textarea
                    id="recipe-summary"
                    value={form.summary}
                    onChange={event => setForm(current => ({ ...current, summary: event.target.value }))}
                    minLength={12}
                    maxLength={1200}
                    required
                    className="mt-2 min-h-24 rounded-xl border-[var(--line)]"
                  />
                </div>
                <div>
                  <Label htmlFor="recipe-category" className="text-sm font-extrabold">Categoria da receita</Label>
                  <select
                    id="recipe-category"
                    value={form.category}
                    onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                  >
                    {RECIPE_CATEGORIES.map(item => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <legend className="px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Prévia da capa</legend>
              <div
                onDragOver={event => event.preventDefault()}
                onDrop={dropHandler(handleCover)}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-[var(--line)] p-4"
              >
                <div className="grid h-40 w-32 place-items-center overflow-hidden rounded-xl bg-[var(--linen)] p-2">
                  {coverBusy ? (
                    <Loader2 size={20} className="animate-spin text-[var(--sage-deep)]" />
                  ) : form.coverImageUrl ? (
                    <img src={form.coverImageUrl} alt="Prévia da capa" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="grid h-full place-items-center text-[var(--ink-soft)]"><ImageIcon size={20} /></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">Gerada automaticamente a partir da primeira página do PDF.</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    Ao enviar ou substituir o PDF, a capa é recriada sozinha, preservando a proporção original da página.
                    O envio manual de imagem é opcional (JPG, PNG ou WEBP até 6 MB).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.pdfKey || form.pdfUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={coverBusy || !form.id}
                        onClick={async () => {
                          if (!form.id) return;
                          setCoverBusy(true);
                          try {
                            const cover = await generateCoverFromPdf(form.id, form.title || "capa");
                            setForm(current => ({ ...current, coverImageKey: cover.key, coverImageUrl: cover.url }));
                            toast.success("Capa regenerada.");
                          } catch {
                            toast.error("Não foi possível gerar a capa deste PDF.");
                          } finally {
                            setCoverBusy(false);
                          }
                        }}
                        className="rounded-xl text-xs font-extrabold"
                      >
                        {coverBusy ? <Loader2 size={14} className="mr-2 animate-spin" /> : <RefreshCw size={14} className="mr-2" />}
                        Regenerar da página 1
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={() => coverInput.current?.click()} disabled={coverBusy} className="rounded-xl text-xs font-extrabold">
                      <Upload size={14} className="mr-2" />
                      Enviar imagem manual
                    </Button>
                    {form.coverImageUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForm(current => ({ ...current, coverImageKey: null, coverImageUrl: null }))}
                        className="rounded-xl text-xs font-extrabold text-[#9c583c]"
                      >
                        <X size={14} className="mr-2" /> Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
                <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={event => { handleCover(event.target.files?.[0]); event.target.value = ""; }} />
              </div>

            </fieldset>

            <fieldset className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <legend className="px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Conteúdo</legend>
              <div
                onDragOver={event => event.preventDefault()}
                onDrop={dropHandler(handlePdf)}
                className="rounded-xl border border-dashed border-[var(--line)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">{form.pdfKey ? form.pdfName || "PDF enviado" : "Arraste o PDF ou selecione"}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">Arquivo PDF de até 50 MB.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => pdfInput.current?.click()} disabled={pdfProgress !== null} className="rounded-xl text-xs font-extrabold">
                      {pdfProgress !== null ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                      {form.pdfKey ? "Substituir" : "Selecionar"}
                    </Button>
                    {form.pdfUrl ? (
                      <a href={form.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-extrabold text-[var(--sage-deep)]">
                        <Eye size={14} className="mr-1.5" /> Ver
                      </a>
                    ) : null}
                    {form.pdfKey ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForm(current => ({ ...current, pdfKey: null, pdfUrl: null, pdfName: null }))}
                        className="rounded-xl text-xs font-extrabold text-[#9c583c]"
                      >
                        <X size={14} className="mr-2" /> Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
                {pdfProgress !== null ? (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--linen)]">
                    <div className="h-full bg-[var(--sage-deep)] transition-all" style={{ width: `${pdfProgress}%` }} />
                  </div>
                ) : null}
                <input ref={pdfInput} type="file" accept="application/pdf" className="hidden" onChange={event => { handlePdf(event.target.files?.[0]); event.target.value = ""; }} />
              </div>
              <div className="mt-4">
                <Label htmlFor="recipe-content" className="text-sm font-extrabold">Informações complementares <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label>
                <Textarea
                  id="recipe-content"
                  value={form.content}
                  onChange={event => setForm(current => ({ ...current, content: event.target.value }))}
                  className="mt-2 min-h-24 rounded-xl border-[var(--line)]"
                />
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <legend className="px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Organização</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="recipe-callout" className="text-sm font-extrabold">Destaque da capa <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label>
                  <Input
                    id="recipe-callout"
                    value={form.callout}
                    onChange={event => setForm(current => ({ ...current, callout: event.target.value }))}
                    maxLength={120}
                    className="mt-2 h-11 rounded-xl border-[var(--line)]"
                  />
                </div>
                <div>
                  <Label htmlFor="recipe-accent" className="text-sm font-extrabold">Cor de fundo</Label>
                  <Input
                    id="recipe-accent"
                    type="color"
                    value={form.accentColor}
                    onChange={event => setForm(current => ({ ...current, accentColor: event.target.value }))}
                    className="mt-2 h-11 rounded-xl border-[var(--line)] p-1"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <legend className="px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">Publicação</legend>
              <div className="flex flex-wrap gap-2">
                {(["draft", "published", "archived"] as Status[]).map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setForm(current => ({ ...current, status: item }))}
                    aria-pressed={form.status === item}
                    className={`rounded-full px-4 py-2 text-xs font-extrabold ${form.status === item ? "bg-[var(--sage-deep)] text-white" : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)]"}`}
                  >
                    {statusMeta[item].label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-extrabold">
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending} className="pressable rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white">
                {save.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : null} Salvar receita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
