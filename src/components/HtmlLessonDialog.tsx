import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function HtmlLessonDialog({ lesson, onClose }: { lesson: { id: number; title: string }; onClose: () => void }) {
  const source = trpc.community.htmlSource.useQuery({ documentId: lesson.id });
  return (
    <div className="fixed inset-0 z-50 flex bg-[rgba(9,28,61,.86)] sm:p-3" role="dialog" aria-modal="true" aria-label={`Aula interativa: ${lesson.title}`}>
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white sm:h-[calc(100dvh-1.5rem)] sm:rounded-2xl">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--line)] px-3 sm:px-5">
          <div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--sage)]">Aula interativa protegida</p><h2 className="truncate text-sm font-extrabold">{lesson.title}</h2></div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-[var(--linen)]" aria-label="Fechar aula"><X size={22} /></button>
        </header>
        <div className="min-h-0 flex-1 bg-[#eef1f0]">
          {source.data?.url ? <iframe src={source.data.url} title={lesson.title} className="h-full w-full border-0" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" allow="fullscreen" /> : source.isError ? <div className="grid h-full place-items-center p-6 text-center text-sm text-[var(--ink-soft)]">Não foi possível abrir esta aula. Confirme sua assinatura e tente novamente.</div> : <div className="grid h-full place-items-center text-sm font-bold text-[var(--ink-soft)]">Carregando aula…</div>}
        </div>
      </div>
    </div>
  );
}
