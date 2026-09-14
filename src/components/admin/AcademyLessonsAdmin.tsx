import { ArrowDown, ArrowUp, CheckCircle2, FileUp, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type Lesson = {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  moduleId: number | null;
  contentType: "pdf" | "video" | "html";
  htmlKey: string | null;
  estimatedDuration: string | null;
  technicalReview: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  status: "draft" | "published" | "archived";
  position: number;
};

type ModuleItem = { id: number; name: string; slug: string };

type LessonForm = {
  id?: number;
  title: string;
  summary: string;
  estimatedDuration: string;
  htmlKey: string | null;
  status: "draft" | "published" | "archived";
  position: number;
};

const emptyForm = (position: number): LessonForm => ({
  title: "",
  summary: "",
  estimatedDuration: "",
  htmlKey: null,
  status: "draft",
  position,
});

async function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

const statusLabel = (status: Lesson["status"]) =>
  status === "published" ? "Publicada" : status === "draft" ? "Rascunho" : "Arquivada";

export function AcademyLessonsAdmin() {
  const utils = trpc.useUtils();
  const dashboard = trpc.community.admin.dashboard.useQuery();
  const taxonomy = trpc.community.admin.taxonomy.useQuery();
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [form, setForm] = useState<LessonForm | null>(null);

  const modules = (taxonomy.data?.academyModules ?? []) as ModuleItem[];
  const activeModuleId = moduleId ?? modules[0]?.id ?? null;
  const activeModule = modules.find((item) => item.id === activeModuleId) ?? null;

  const lessons = useMemo(() => {
    const all = ((dashboard.data?.guides ?? []) as Lesson[]).filter(
      (item) => item.moduleId === activeModuleId && item.contentType === "html",
    );
    return all.sort((a, b) => a.position - b.position);
  }, [dashboard.data, activeModuleId]);

  const refresh = async () => {
    await utils.n.invalidate();
    await dashboard.refetch();
  };

  const save = trpc.community.admin.saveGuide.useMutation({
    onSuccess: async () => {
      toast.success("Aula salva.");
      setForm(null);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const uploadHtml = trpc.community.files.uploadGuideHtml.useMutation({
    onSuccess: (result: { key: string }) => {
      setForm((current) => (current ? { ...current, htmlKey: result.key } : current));
      toast.success("Arquivo HTML carregado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const persist = (lesson: Lesson | LessonForm, overrides: Partial<LessonForm> = {}) => {
    const base = "contentType" in lesson ? lesson : null;
    return save.mutateAsync({
      id: lesson.id,
      title: overrides.title ?? lesson.title,
      summary: overrides.summary ?? lesson.summary ?? "",
      content: "",
      category: base?.category ?? activeModule?.name ?? "",
      moduleId: activeModuleId,
      contentType: "html",
      videoUrl: "",
      estimatedDuration: overrides.estimatedDuration ?? lesson.estimatedDuration ?? "",
      technicalReview: base?.technicalReview ?? "",
      pdfKey: null,
      pdfUrl: null,
      htmlKey: overrides.htmlKey ?? lesson.htmlKey ?? null,
      coverImageKey: base?.coverImageKey ?? null,
      coverImageUrl: base?.coverImageUrl ?? null,
      status: overrides.status ?? lesson.status,
      position: overrides.position ?? lesson.position,
    });
  };

  const move = async (index: number, direction: -1 | 1) => {
    const current = lessons[index];
    const target = lessons[index + direction];
    if (!current || !target) return;
    await persist(current, { position: target.position });
    await persist(target, { position: current.position });
    await refresh();
  };

  const submit = async () => {
    if (!form) return;
    if (!form.title.trim()) return toast.error("Informe o título da aula.");
    if (!activeModuleId) return toast.error("Selecione um módulo.");
    if (form.status === "published" && !form.htmlKey)
      return toast.error("Envie o arquivo HTML antes de publicar.");
    await persist(form);
  };

  if (taxonomy.isLoading || dashboard.isLoading)
    return <div className="h-40 animate-pulse rounded-3xl bg-[var(--linen)]" />;

  return (
    <section className="space-y-5">
      <div className="soft-card rounded-3xl bg-white p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
          Aulas da Academia
        </p>
        <h2 className="display-font mt-1 text-2xl font-semibold">
          Publique novas aulas sem sair da plataforma
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
          Escolha o módulo, envie o arquivo HTML da aula, ajuste o título e a ordem dos capítulos e
          publique quando estiver pronta.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {modules.map((item) => {
            const active = item.id === activeModuleId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setModuleId(item.id);
                  setForm(null);
                }}
                className={`min-h-[44px] rounded-xl px-4 text-xs font-extrabold transition ${
                  active
                    ? "bg-[var(--sage-deep)] text-white"
                    : "bg-[var(--linen)] text-[var(--ink-soft)]"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
          {lessons.length} {lessons.length === 1 ? "aula" : "aulas"} em{" "}
          {activeModule?.name ?? "—"}
        </p>
        <Button
          type="button"
          onClick={() => setForm(emptyForm(lessons.length + 1))}
          className="pressable h-11 rounded-xl bg-[var(--sage-deep)] px-4 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
        >
          <Plus size={15} className="mr-1.5" /> Nova aula
        </Button>
      </div>

      {form ? (
        <div className="soft-card space-y-4 rounded-3xl bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="display-font text-xl font-semibold">
              {form.id ? "Editar aula" : "Nova aula"}
            </h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm(null)}
              className="h-11 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold"
            >
              <X size={15} className="mr-1.5" /> Cancelar
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-extrabold">Título da aula</Label>
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="mt-1.5 h-11 rounded-xl"
                placeholder="Aula 17 — Título"
              />
            </div>
            <div>
              <Label className="text-xs font-extrabold">Duração estimada</Label>
              <Input
                value={form.estimatedDuration}
                onChange={(event) => setForm({ ...form, estimatedDuration: event.target.value })}
                className="mt-1.5 h-11 rounded-xl"
                placeholder="20 minutos"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-extrabold">Resumo</Label>
            <Textarea
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              className="mt-1.5 rounded-xl"
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-extrabold">Arquivo HTML da aula</Label>
              <label className="mt-1.5 flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--line)] px-4 text-xs font-extrabold text-[var(--ink-soft)]">
                <FileUp size={15} />
                {uploadHtml.isPending
                  ? "Enviando…"
                  : form.htmlKey
                    ? "HTML carregado"
                    : "Selecionar arquivo .html"}
                <input
                  type="file"
                  accept=".html,text/html"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await readAsDataUrl(file);
                    await uploadHtml.mutateAsync({ fileName: file.name, dataUrl });
                  }}
                />
              </label>
            </div>
            <div>
              <Label className="text-xs font-extrabold">Ordem do capítulo</Label>
              <Input
                type="number"
                value={form.position}
                onChange={(event) =>
                  setForm({ ...form, position: Number(event.target.value) || 0 })
                }
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["draft", "published", "archived"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setForm({ ...form, status })}
                className={`min-h-[44px] rounded-xl px-4 text-xs font-extrabold transition ${
                  form.status === status
                    ? "bg-[var(--sage-deep)] text-white"
                    : "bg-[var(--linen)] text-[var(--ink-soft)]"
                }`}
              >
                {statusLabel(status)}
              </button>
            ))}
            <Button
              type="button"
              disabled={save.isPending}
              onClick={() => void submit()}
              className="pressable ml-auto h-11 rounded-xl bg-[var(--sage-deep)] px-4 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
            >
              <Save size={15} className="mr-1.5" /> Salvar aula
            </Button>
          </div>
        </div>
      ) : null}

      <ol className="space-y-3">
        {lessons.map((lesson, index) => (
          <li
            key={lesson.id}
            className="soft-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white p-4"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">
                Capítulo {index + 1} ·{" "}
                {lesson.status === "published" ? (
                  <span className="text-[var(--sage-deep)]">Publicada</span>
                ) : (
                  statusLabel(lesson.status)
                )}
                {lesson.htmlKey ? "" : " · sem arquivo HTML"}
              </p>
              <p className="truncate text-sm font-bold">{lesson.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label="Subir aula"
                disabled={index === 0 || save.isPending}
                onClick={() => void move(index, -1)}
                className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--linen)] disabled:opacity-40"
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                aria-label="Descer aula"
                disabled={index === lessons.length - 1 || save.isPending}
                onClick={() => void move(index, 1)}
                className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--linen)] disabled:opacity-40"
              >
                <ArrowDown size={15} />
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm({
                    id: lesson.id,
                    title: lesson.title,
                    summary: lesson.summary ?? "",
                    estimatedDuration: lesson.estimatedDuration ?? "",
                    htmlKey: lesson.htmlKey,
                    status: lesson.status,
                    position: lesson.position,
                  })
                }
                className="h-11 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold"
              >
                Editar
              </Button>
              {lesson.status === "published" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={save.isPending}
                  onClick={async () => {
                    await persist(lesson, { status: "draft" });
                    await refresh();
                  }}
                  className="h-11 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold"
                >
                  <Trash2 size={15} className="mr-1.5" /> Despublicar
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={save.isPending || !lesson.htmlKey}
                  onClick={async () => {
                    await persist(lesson, { status: "published" });
                    await refresh();
                  }}
                  className="pressable h-11 rounded-xl bg-[var(--sage-deep)] px-4 text-xs font-extrabold text-white hover:bg-[var(--ink)]"
                >
                  <CheckCircle2 size={15} className="mr-1.5" /> Publicar
                </Button>
              )}
            </div>
          </li>
        ))}
        {lessons.length === 0 ? (
          <li className="soft-card rounded-2xl bg-white p-6 text-center text-sm text-[var(--ink-soft)]">
            Nenhuma aula neste módulo ainda. Clique em “Nova aula” para começar.
          </li>
        ) : null}
      </ol>
    </section>
  );
}
