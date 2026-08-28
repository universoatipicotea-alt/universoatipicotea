import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2, Minus, Plus, RotateCcw, Save, StickyNote, Trash2, X } from "lucide-react";
import { call, trpc } from "@/lib/trpc";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Os PDFs ficam em armazenamento privado. Quando a página pede a rota
 * protegida, trocamos por um link assinado e temporário no servidor.
 */
async function resolvePdfSource(src: string) {
  const match = /\/api\/protected-pdf\/(guide|test-guide)\/(\d+)/.exec(src);
  if (!match) return src;
  const result = (await call("community.pdfSource", {
    sourceType: match[1] === "test-guide" ? "testGuide" : "guide",
    documentId: Number(match[2]),
  })) as { url: string };
  return result.url;
}

type PdfReaderProps = {
  src: string;
  title: string;
  progressKey?: string;
  progressSource?: "guide" | "testGuide";
  documentId?: number;
};

export default function PdfReader({ src, title, progressSource = "guide", documentId = 0 }: PdfReaderProps) {
  const progressEnabled = Number.isInteger(documentId) && documentId > 0;
  const queryDocumentId = progressEnabled ? documentId : 1;
  const progressQuery = trpc.community.readingProgress.get.useQuery(
    { sourceType: progressSource, documentId: queryDocumentId },
    { enabled: progressEnabled, staleTime: 30_000 },
  );
  const saveProgress = trpc.community.readingProgress.save.useMutation();
  const annotationsQuery = trpc.community.annotations.list.useQuery(
    { sourceType: progressSource, documentId: queryDocumentId },
    { enabled: progressEnabled, staleTime: 15_000 },
  );
  const annotationsUtils = trpc.useUtils();
  const createAnnotation = trpc.community.annotations.create.useMutation();
  const updateAnnotation = trpc.community.annotations.update.useMutation();
  const deleteAnnotation = trpc.community.annotations.delete.useMutation();
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [progressReady, setProgressReady] = useState(!progressEnabled);
  const [scale, setScale] = useState(1.05);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [draftNote, setDraftNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const canvases = useRef<HTMLCanvasElement[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!progressEnabled || progressQuery.isFetched) {
      const savedPage = progressQuery.data?.currentPage ?? 1;
      setCurrentPage(Math.max(1, savedPage));
      setProgressReady(true);
    }
  }, [progressEnabled, progressQuery.data?.currentPage, progressQuery.isFetched]);

  useEffect(() => {
    if (!progressEnabled || !progressReady || !pageCount) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveProgress.mutateAsync({ sourceType: progressSource, documentId, currentPage: Math.min(currentPage, pageCount), pageCount }).catch(() => undefined);
    }, 450);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [currentPage, documentId, pageCount, progressEnabled, progressReady, progressSource]);

  useEffect(() => {
    const visible = new IntersectionObserver(entries => {
      const page = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const index = page ? Number((page.target as HTMLElement).dataset.page) : 0;
      if (index) setCurrentPage(index);
    }, { rootMargin: "-18% 0px -58% 0px", threshold: [0.2, 0.5, 0.8] });
    canvases.current.forEach((canvas, index) => { if (canvas) { canvas.dataset.page = String(index + 1); visible.observe(canvas); } });
    return () => visible.disconnect();
  }, [pageCount, scale, loading]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(null); setPageCount(0); canvases.current = [];
      try {
        const response = await fetch(await resolvePdfSource(src));
        if (!response.ok) throw new Error("Não foi possível carregar o PDF.");
        const document = await pdfjsLib.getDocument({ data: await response.arrayBuffer() }).promise;
        if (cancelled) return;
        setPageCount(document.numPages);
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber); if (cancelled) break;
          const canvas = canvases.current[pageNumber - 1]; if (!canvas) continue;
          const context = canvas.getContext("2d"); if (!context) continue;
          const viewport = page.getViewport({ scale }); canvas.width = viewport.width; canvas.height = viewport.height;
          canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
          await page.render({ canvasContext: context, canvas, viewport }).promise;
        }
        requestAnimationFrame(() => { const target = canvases.current[Math.min(currentPage, document.numPages) - 1]; target?.scrollIntoView({ block: "start" }); });
      } catch (loadError) { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Não foi possível exibir este PDF."); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load(); return () => { cancelled = true; };
  }, [src, scale]);

  const continueReading = () => canvases.current[Math.max(0, Math.min((progressQuery.data?.currentPage ?? 1) - 1, pageCount - 1))]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const startNewNote = () => { setEditingNoteId(null); setDraftNote(""); };
  const editNote = (id: number, note: string) => { setEditingNoteId(id); setDraftNote(note); };
  const submitNote = async () => {
    const note = draftNote.trim();
    if (!note || !progressEnabled) return;
    if (editingNoteId) {
      await updateAnnotation.mutateAsync({ id: editingNoteId, note });
    } else {
      await createAnnotation.mutateAsync({ sourceType: progressSource, documentId, pageNumber: Math.min(currentPage, pageCount || 1), note });
    }
    await annotationsUtils.community.annotations.list.invalidate({ sourceType: progressSource, documentId: queryDocumentId });
    startNewNote();
  };
  const removeNote = async (id: number) => {
    await deleteAnnotation.mutateAsync({ id });
    await annotationsUtils.community.annotations.list.invalidate({ sourceType: progressSource, documentId: queryDocumentId });
    if (editingNoteId === id) startNewNote();
  };
  const notesBusy = createAnnotation.isPending || updateAnnotation.isPending || deleteAnnotation.isPending;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[#525252]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[var(--ink)] px-4 py-3 text-white">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#efd4a2]">Visualização completa</p>
          <p className="mt-1 text-xs font-semibold text-white/75">{pageCount ? `${currentPage} de ${pageCount} páginas${progressEnabled ? " — progresso salvo" : ""}` : "Carregando páginas…"}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={continueReading} disabled={!progressEnabled || !pageCount || !progressQuery.data?.currentPage || progressQuery.data.currentPage <= 1} className="rounded-lg border border-white/15 px-3 py-2 text-[10px] font-extrabold text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Continuar da página {progressQuery.data?.currentPage ?? 1}</button>
          <button type="button" onClick={() => setNotesOpen(open => !open)} disabled={!progressEnabled} className="inline-flex items-center gap-1.5 rounded-lg border border-[#efd4a2]/35 px-3 py-2 text-[10px] font-extrabold text-[#efd4a2] transition hover:bg-[#efd4a2]/10 disabled:cursor-not-allowed disabled:opacity-40"><StickyNote size={14} /> Anotações</button>
          <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
            <button type="button" onClick={() => setScale(current => Math.max(0.7, Number((current - 0.15).toFixed(2))))} className="rounded-lg p-2 text-white/80 hover:bg-white/10" aria-label="Diminuir zoom"><Minus size={15} /></button>
            <span className="min-w-14 text-center text-xs font-bold">{Math.round(scale * 100)}%</span>
            <button type="button" onClick={() => setScale(current => Math.min(1.8, Number((current + 0.15).toFixed(2))))} className="rounded-lg p-2 text-white/80 hover:bg-white/10" aria-label="Aumentar zoom"><Plus size={15} /></button>
            <button type="button" onClick={() => setScale(1.05)} className="rounded-lg p-2 text-white/80 hover:bg-white/10" aria-label="Redefinir zoom"><RotateCcw size={15} /></button>
          </div>
        </div>
      </div>
      <div className={`grid min-w-0 ${notesOpen && progressEnabled ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "grid-cols-1"}`}>
        <div className="max-h-[calc(100vh-13rem)] min-h-[620px] overflow-auto bg-[#525252] p-4 select-none sm:p-8" onContextMenu={event => event.preventDefault()}>
          {loading ? <div className="flex min-h-[560px] items-center justify-center gap-3 text-sm font-semibold text-white/80"><Loader2 className="animate-spin" size={20} />Preparando todas as páginas do guia…</div> : null}
          {error ? <div className="mx-auto flex min-h-[360px] max-w-lg items-center justify-center text-center text-sm leading-6 text-white/80">{error}</div> : null}
          <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-6">{Array.from({ length: pageCount }, (_, index) => <canvas key={`${src}-${index + 1}`} ref={canvas => { if (canvas) canvases.current[index] = canvas; }} aria-label={`${title}, página ${index + 1}`} className="block max-w-none bg-white shadow-2xl" />)}</div>
        </div>
        {notesOpen && progressEnabled ? <aside className="border-t border-white/10 bg-[#fbfaf7] p-4 text-[var(--ink)] lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6b3f]">Meu espaço</p><h3 className="mt-1 text-lg font-black">Anotações</h3><p className="mt-1 text-xs leading-5 text-slate-500">Registre ideias e observações ligadas a este guia.</p></div><button type="button" onPointerDown={event => event.stopPropagation()} onClick={() => setNotesOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c89c61]" aria-label="Fechar anotações"><X size={18} /></button></div>
          <div className="mt-4 rounded-xl border border-[#e8e1d6] bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold">{editingNoteId ? "Editar anotação" : `Nova anotação · página ${Math.min(currentPage, pageCount || 1)}`}</p>{editingNoteId ? <button type="button" onClick={startNewNote} className="text-[11px] font-bold text-slate-500 hover:text-[var(--ink)]">Nova</button> : null}</div><textarea value={draftNote} onChange={event => setDraftNote(event.target.value)} placeholder="Escreva uma observação para voltar depois…" rows={5} maxLength={5000} className="mt-3 w-full resize-y rounded-lg border border-[#e8e1d6] bg-[#fbfaf7] px-3 py-2 text-sm leading-5 outline-none transition focus:border-[#c89c61] focus:ring-2 focus:ring-[#c89c61]/20" /><button type="button" onClick={() => void submitNote()} disabled={!draftNote.trim() || notesBusy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ink)] px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#153968] disabled:cursor-not-allowed disabled:opacity-50"><Save size={14} />{notesBusy ? "Salvando…" : editingNoteId ? "Atualizar anotação" : "Salvar anotação"}</button></div>
          <div className="mt-5"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b6b3f]">Salvas neste guia</p><span className="rounded-full bg-[#f0eadf] px-2 py-1 text-[10px] font-extrabold text-[#8b6b3f]">{annotationsQuery.data?.length ?? 0}</span></div>{annotationsQuery.isLoading ? <p className="mt-3 text-xs text-slate-500">Carregando anotações…</p> : annotationsQuery.data?.length ? <div className="mt-3 space-y-3">{annotationsQuery.data.map(annotation => <div key={annotation.id} className="rounded-xl border border-[#e8e1d6] bg-white p-3"><div className="flex items-start justify-between gap-2"><span className="rounded-full bg-[#edf3f8] px-2 py-1 text-[10px] font-extrabold text-[#153968]">Página {annotation.pageNumber}</span><div className="flex items-center gap-1"><button type="button" onClick={() => editNote(annotation.id, annotation.note)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[var(--ink)]" aria-label={`Editar anotação da página ${annotation.pageNumber}`}><StickyNote size={14} /></button><button type="button" onClick={() => void removeNote(annotation.id)} disabled={notesBusy} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir anotação da página ${annotation.pageNumber}`}><Trash2 size={14} /></button></div></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{annotation.note}</p></div>)}</div> : <p className="mt-3 rounded-xl border border-dashed border-[#d8cbb8] p-3 text-xs leading-5 text-slate-500">Nenhuma anotação ainda. Escreva uma observação sobre a página atual.</p>}</div>
        </aside> : null}
      </div>
      <div className="border-t border-white/10 bg-white/95 px-4 py-2 text-center text-[11px] font-semibold text-slate-500">O conteúdo é protegido e disponibilizado somente para leitura dentro da plataforma. Suas anotações são pessoais.</div>
    </div>
  );
}
