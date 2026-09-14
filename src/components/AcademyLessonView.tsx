import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export type AcademyLesson = { id: number; title: string };

export function AcademyLessonView({
  lessons,
  currentId,
  completedIds,
  onSelect,
  onClose,
  onCompleted,
}: {
  lessons: AcademyLesson[];
  currentId: number;
  completedIds: Set<number>;
  onSelect: (id: number) => void;
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const index = Math.max(
    0,
    lessons.findIndex((item) => item.id === currentId),
  );
  const current = lessons[index];
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;
  const source = trpc.community.htmlSource.useQuery({ documentId: currentId });
  const saveProgress = trpc.community.readingProgress.save.useMutation();
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const frameWrapper = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const isCompleted = completedIds.has(currentId);
  const completedCount = useMemo(
    () => lessons.filter((item) => completedIds.has(item.id)).length,
    [lessons, completedIds],
  );
  const percent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  useEffect(() => {
    setChaptersOpen(false);
    frameWrapper.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [currentId]);

  // Passa a página dentro da aula sem alterar os arquivos originais:
  // envia a mesma tecla de seta que o próprio material já entende.
  const turnPage = useCallback((direction: "next" | "previous") => {
    const frame = frameRef.current;
    const win = frame?.contentWindow;
    const doc = win?.document;
    if (!win || !doc) return;
    const key = direction === "next" ? "ArrowRight" : "ArrowLeft";
    const init: KeyboardEventInit = {
      key,
      code: key,
      keyCode: direction === "next" ? 39 : 37,
      which: direction === "next" ? 39 : 37,
      bubbles: true,
      cancelable: true,
    } as KeyboardEventInit;
    const KeyboardEventCtor = (win as unknown as { KeyboardEvent: typeof KeyboardEvent })
      .KeyboardEvent;
    for (const target of [doc, doc.body, win] as EventTarget[]) {
      try {
        target.dispatchEvent(new KeyboardEventCtor("keydown", init));
        target.dispatchEvent(new KeyboardEventCtor("keyup", init));
      } catch {
        /* conteúdo ainda carregando */
      }
    }
  }, []);

  // Deslizar o dedo dentro da aula, como num leitor de livro.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let cleanup: (() => void) | undefined;
    const attach = () => {
      const doc = frame.contentWindow?.document;
      if (!doc) return;
      let startX = 0;
      let startY = 0;
      let tracking = false;
      const onStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        if (!touch) return;
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
      };
      const onEnd = (event: TouchEvent) => {
        if (!tracking) return;
        tracking = false;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
        turnPage(dx < 0 ? "next" : "previous");
      };
      doc.addEventListener("touchstart", onStart, { passive: true });
      doc.addEventListener("touchend", onEnd, { passive: true });
      cleanup = () => {
        doc.removeEventListener("touchstart", onStart);
        doc.removeEventListener("touchend", onEnd);
      };
    };
    frame.addEventListener("load", attach);
    attach();
    return () => {
      frame.removeEventListener("load", attach);
      cleanup?.();
    };
  }, [currentId, source.data?.url, turnPage]);

  const markCompleted = async (then?: () => void) => {
    if (!isCompleted) {
      await saveProgress
        .mutateAsync({ sourceType: "guide", documentId: currentId, currentPage: 1, pageCount: 1 })
        .catch(() => undefined);
      onCompleted?.();
    }
    then?.();
  };

  return (
    <section
      ref={frameWrapper}
      className="scroll-mt-24"
      aria-label={`Aula interativa: ${current?.title ?? ""}`}
    >
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
            Aula {index + 1} de {lessons.length}
          </p>
          <h2 className="display-font mt-1 truncate text-xl font-semibold leading-tight sm:text-3xl">
            {current?.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setChaptersOpen(true)}
            aria-label="Abrir capítulos"
            className="h-11 rounded-xl border-[var(--line)] bg-white px-3 text-xs font-extrabold lg:hidden"
          >
            <ListChecks size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            aria-label="Fechar aula"
            className="h-11 rounded-xl border-[var(--line)] bg-white px-3 text-xs font-extrabold"
          >
            <X size={16} />
            <span className="ml-1.5 hidden sm:inline">Fechar aula</span>
          </Button>
        </div>
      </div>

      <div className="mb-4 max-w-xl sm:mb-5">
        <div className="mb-2 flex justify-between text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
          <span>Progresso do módulo</span>
          <span>
            {completedCount}/{lessons.length} · {percent}%
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--linen)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full rounded-full bg-[var(--sage-deep)] transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {chaptersOpen ? (
          <button
            type="button"
            aria-label="Fechar capítulos"
            onClick={() => setChaptersOpen(false)}
            className="fixed inset-0 z-40 bg-[var(--ink)]/45 lg:hidden"
          />
        ) : null}
        <aside
          className={`${
            chaptersOpen
              ? "fixed inset-x-3 bottom-3 top-16 z-50 overflow-hidden rounded-3xl bg-white p-2 shadow-2xl"
              : "hidden"
          } lg:static lg:z-auto lg:block lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none`}
          aria-label="Capítulos do módulo"
        >
          <div className="flex items-center justify-between px-3 py-2 lg:hidden">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              Capítulos
            </span>
            <button
              type="button"
              onClick={() => setChaptersOpen(false)}
              aria-label="Fechar capítulos"
              className="grid h-10 w-10 place-items-center rounded-full bg-[var(--linen)]"
            >
              <X size={16} />
            </button>
          </div>
          <ol className="soft-card max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-3xl bg-white p-2 lg:max-h-[70vh]">
            {lessons.map((lesson, position) => {
              const done = completedIds.has(lesson.id);
              const active = lesson.id === currentId;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(lesson.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-[48px] w-full items-start gap-2.5 rounded-2xl px-3 py-3 text-left text-xs font-bold transition ${
                      active
                        ? "bg-[var(--sage-deep)] text-white"
                        : "text-[var(--ink-soft)] hover:bg-[var(--linen)]"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    ) : (
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-current text-[9px]">
                        {position + 1}
                      </span>
                    )}
                    <span className="min-w-0 leading-5">{lesson.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="soft-card overflow-hidden rounded-2xl bg-white sm:rounded-3xl">
          <div className="relative h-[calc(100dvh-14rem)] min-h-[380px] bg-[#eef1f0] sm:h-[72vh] lg:h-[78vh]">
            {source.data?.url ? (
              <iframe
                key={currentId}
                ref={frameRef}
                src={source.data.url}
                title={current?.title ?? "Aula interativa"}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                allow="fullscreen"
              />
            ) : source.isError ? (
              <div className="grid h-full place-items-center p-6 text-center text-sm text-[var(--ink-soft)]">
                Não foi possível abrir esta aula. Confirme seu acesso e tente novamente.
              </div>
            ) : (
              <div className="grid h-full place-items-center text-sm font-bold text-[var(--ink-soft)]">
                Carregando aula…
              </div>
            )}
            {source.data?.url ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-between px-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => turnPage("previous")}
                  aria-label="Página anterior da aula"
                  className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-lg backdrop-blur"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => turnPage("next")}
                  aria-label="Próxima página da aula"
                  className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-lg backdrop-blur"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            ) : null}
          </div>
          <p className="border-t border-[var(--line)] px-4 py-2 text-center text-[11px] font-bold text-[var(--ink-soft)] lg:hidden">
            Deslize para o lado para passar as páginas da aula.
          </p>
          <div className="grid gap-2 border-t border-[var(--line)] p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-4">
            <Button
              type="button"
              variant="outline"
              disabled={!previous}
              onClick={() => previous && onSelect(previous.id)}
              className="h-12 w-full rounded-xl border-[var(--line)] bg-white text-xs font-extrabold sm:h-11 sm:w-auto"
            >
              <ArrowLeft size={15} className="mr-1.5" /> Aula anterior
            </Button>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Button
                type="button"
                variant="outline"
                disabled={isCompleted || saveProgress.isPending}
                onClick={() => void markCompleted()}
                className="h-12 w-full rounded-xl border-[var(--line)] bg-white text-xs font-extrabold sm:h-11 sm:w-auto"
              >
                <CheckCircle2 size={15} className="mr-1.5" />
                {isCompleted ? "Aula concluída" : "Marcar como concluída"}
              </Button>
              <Button
                type="button"
                disabled={!next}
                onClick={() => void markCompleted(() => next && onSelect(next.id))}
                className="pressable h-12 w-full rounded-xl bg-[var(--sage-deep)] px-4 text-xs font-extrabold text-white hover:bg-[var(--ink)] sm:h-11 sm:w-auto"
              >
                Próxima aula <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
