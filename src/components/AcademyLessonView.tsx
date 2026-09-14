import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
            Aula {index + 1} de {lessons.length}
          </p>
          <h2 className="display-font mt-1 truncate text-2xl font-semibold leading-tight sm:text-3xl">
            {current?.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setChaptersOpen((value) => !value)}
            className="h-11 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold lg:hidden"
          >
            <ListChecks size={15} className="mr-1.5" /> Capítulos
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold"
          >
            <X size={15} className="mr-1.5" /> Fechar aula
          </Button>
        </div>
      </div>

      <div className="mb-5 max-w-xl">
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
        <aside
          className={`${chaptersOpen ? "block" : "hidden"} lg:block`}
          aria-label="Capítulos do módulo"
        >
          <ol className="soft-card max-h-[70vh] overflow-y-auto rounded-3xl bg-white p-2">
            {lessons.map((lesson, position) => {
              const done = completedIds.has(lesson.id);
              const active = lesson.id === currentId;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(lesson.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-[44px] w-full items-start gap-2.5 rounded-2xl px-3 py-3 text-left text-xs font-bold transition ${
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

        <div className="soft-card overflow-hidden rounded-3xl bg-white">
          <div className="h-[72vh] min-h-[420px] bg-[#eef1f0] lg:h-[78vh]">
            {source.data?.url ? (
              <iframe
                key={currentId}
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
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] p-4">
            <Button
              type="button"
              variant="outline"
              disabled={!previous}
              onClick={() => previous && onSelect(previous.id)}
              className="h-11 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold"
            >
              <ArrowLeft size={15} className="mr-1.5" /> Aula anterior
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCompleted || saveProgress.isPending}
                onClick={() => void markCompleted()}
                className="h-11 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold"
              >
                <CheckCircle2 size={15} className="mr-1.5" />
                {isCompleted ? "Aula concluída" : "Marcar como concluída"}
              </Button>
              <Button
                type="button"
                disabled={!next}
                onClick={() => void markCompleted(() => next && onSelect(next.id))}
                className="pressable h-11 rounded-xl bg-[var(--sage-deep)] px-4 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
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
