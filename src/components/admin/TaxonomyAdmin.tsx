import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImageUp, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContentEmpty, SectionHeading } from "@/components/MemberShell";
import { StatusPill } from "@/components/ds";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugifyPt } from "@/lib/slug";

type Kind = "recipe" | "module";
type Item = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  coverImageKey?: string | null;
  coverImageUrl?: string | null;
  position: number;
  status: "draft" | "published" | "coming_soon" | "archived";
  comingSoonMessage?: string | null;
  contentCount?: number;
  publishedCount?: number;
  draftCount?: number;
};
type Form = Omit<Item, "id" | "contentCount" | "publishedCount" | "draftCount"> & { id?: number };
const empty = (): Form => ({
  name: "",
  slug: "",
  description: "",
  coverImageKey: null,
  coverImageUrl: null,
  position: 0,
  status: "draft",
  comingSoonMessage:
    "Estamos preparando este módulo com cuidado. Em breve, novos conteúdos estarão disponíveis para você.",
});

async function asDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function TaxonomyAdmin({ kind, enabled }: { kind: Kind; enabled: boolean }) {
  const utils = trpc.useUtils();
  const query = trpc.community.admin.taxonomy.useQuery(undefined, { enabled });
  const save = trpc.community.admin.saveTaxonomy.useMutation();
  const remove = trpc.community.admin.deleteTaxonomy.useMutation();
  const upload = trpc.community.files.uploadContentImage.useMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Form>(empty());
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | Item["status"]>("all");
  const [search, setSearch] = useState("");
  const noun = kind === "recipe" ? "categoria" : "módulo";
  const allItems = useMemo(
    () =>
      ((kind === "recipe" ? query.data?.recipeCategories : query.data?.academyModules) ??
        []) as Item[],
    [kind, query.data],
  );
  const term = search.trim().toLowerCase();
  const items = useMemo(
    () =>
      allItems.filter(
        (item) =>
          (filter === "all" || item.status === filter) &&
          (!term || item.name.toLowerCase().includes(term) || item.slug.includes(term)),
      ),
    [allItems, filter, term],
  );
  const totals = {
    all: allItems.length,
    published: allItems.filter((i) => i.status === "published").length,
    coming_soon: allItems.filter((i) => i.status === "coming_soon").length,
    draft: allItems.filter((i) => i.status === "draft").length,
    archived: allItems.filter((i) => i.status === "archived").length,
  };
  const lessons = allItems.reduce((sum, i) => sum + (i.publishedCount ?? 0), 0);
  const refresh = async () => {
    await Promise.all([
      utils.community.admin.taxonomy.invalidate(),
      utils.community.taxonomy.invalidate(),
      utils.community.admin.dashboard.invalidate(),
      utils.community.memberDashboard.invalidate(),
    ]);
  };
  const edit = (item?: Item) => {
    setForm(
      item
        ? {
            ...item,
            description: item.description ?? "",
            comingSoonMessage:
              item.comingSoonMessage ||
              "Estamos preparando este módulo com cuidado. Em breve, novos conteúdos estarão disponíveis para você.",
          }
        : empty(),
    );
    setOpen(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync({ kind, ...form, slug: form.slug || slugifyPt(form.name) });
      await refresh();
      setOpen(false);
      toast.success(`${noun[0].toUpperCase()}${noun.slice(1)} salvo.`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const image = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 6 * 1024 * 1024
    ) {
      toast.error("Envie JPG, PNG ou WEBP com até 6 MB.");
      return;
    }
    try {
      const result = await upload.mutateAsync({
        fileName: file.name,
        dataUrl: await asDataUrl(file),
      });
      setForm((current) => ({ ...current, coverImageKey: result.key, coverImageUrl: result.url }));
      toast.success("Capa carregada. Salve para confirmar.");
    } catch (error) {
      toast.error((error as Error).message);
    }
    event.target.value = "";
  };
  const destroy = async (item: Item) => {
    if (!window.confirm(`Excluir ${noun} "${item.name}"?`)) return;
    try {
      await remove.mutateAsync({ kind, id: item.id });
      await refresh();
      toast.success("Item excluído.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const setStatus = async (item: Item, status: Item["status"]) => {
    try {
      await save.mutateAsync({
        kind,
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description ?? "",
        coverImageKey: item.coverImageKey ?? null,
        coverImageUrl: item.coverImageUrl ?? null,
        position: item.position,
        status,
        comingSoonMessage: item.comingSoonMessage ?? null,
      });
      await refresh();
      toast.success(status === "archived" ? "Item arquivado." : "Item publicado.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const filters: { value: "all" | Item["status"]; label: string; count: number }[] = [
    { value: "all", label: "Todos", count: totals.all },
    { value: "published", label: "Publicados", count: totals.published },
    ...(kind === "module"
      ? [{ value: "coming_soon" as const, label: "Em breve", count: totals.coming_soon }]
      : []),
    { value: "draft", label: "Rascunhos", count: totals.draft },
    { value: "archived", label: "Arquivados", count: totals.archived },
  ];
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          label="Organização editorial"
          title={kind === "recipe" ? "Categorias de Receitas" : "Módulos da Academia"}
        />
        <Button
          onClick={() => edit()}
          className="rounded-xl bg-[var(--sage-deep)] font-extrabold text-white"
        >
          <Plus size={16} className="mr-2" />
          Novo {noun}
        </Button>
      </div>
      <p className="-mt-3 mb-5 text-sm text-[var(--ink-soft)]">
        {totals.published} {totals.published === 1 ? "ativo" : "ativos"} para os membros ·{" "}
        {lessons} {kind === "recipe" ? "receitas publicadas" : "aulas publicadas"} no total
      </p>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`min-h-10 rounded-full border px-4 text-xs font-extrabold transition ${
              filter === option.value
                ? "border-transparent bg-[var(--sage-deep)] text-white"
                : "border-[var(--line)] bg-white text-[var(--ink-soft)]"
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${noun}`}
            className="h-10 rounded-full pl-9"
          />
        </div>
      </div>
      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-72 animate-pulse rounded-3xl bg-[var(--linen)]" />
          <div className="h-72 animate-pulse rounded-3xl bg-[var(--linen)]" />
        </div>
      ) : items.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <article key={item.id} className="soft-card overflow-hidden rounded-3xl bg-white">
              <div className="aspect-[4/3] bg-[var(--linen)]">
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt={`Capa de ${item.name}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="grid h-full place-items-center px-6 text-center">
                    <span className="display-font text-2xl font-semibold">
                      {kind === "module"
                        ? `Módulo ${String(item.position || index + 1).padStart(2, "0")} — `
                        : ""}
                      {item.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <StatusPill status={item.status} />
                  <span className="text-xs font-bold text-[var(--ink-soft)]">
                    Ordem {item.position}
                  </span>
                </div>
                <h3 className="display-font mt-3 text-2xl font-semibold">
                  {kind === "module"
                    ? `Módulo ${String(item.position || index + 1).padStart(2, "0")} — `
                    : ""}
                  {item.name}
                </h3>
                <p className="mt-2 text-xs text-[var(--ink-soft)]">/{item.slug}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold">
                  <span className="rounded-full bg-[var(--linen)] px-3 py-1">
                    {item.publishedCount ?? 0} publicado(s)
                  </span>
                  {item.draftCount ? (
                    <span className="rounded-full bg-[#fdf3e0] px-3 py-1 text-[#8b5f16]">
                      {item.draftCount} em rascunho
                    </span>
                  ) : null}
                  <span className="rounded-full bg-[var(--linen)] px-3 py-1 text-[var(--ink-soft)]">
                    {item.contentCount ?? 0} no total
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => edit(item)}
                    className="rounded-xl text-xs font-extrabold"
                  >
                    <Pencil size={14} className="mr-1.5" />
                    Editar
                  </Button>
                  {item.status === "archived" ? (
                    <Button
                      variant="outline"
                      onClick={() => setStatus(item, "published")}
                      disabled={save.isPending}
                      className="rounded-xl text-xs font-extrabold"
                    >
                      <RotateCcw size={14} className="mr-1.5" />
                      Reativar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setStatus(item, "archived")}
                      disabled={save.isPending}
                      className="rounded-xl text-xs font-extrabold"
                    >
                      <Archive size={14} className="mr-1.5" />
                      Arquivar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => destroy(item)}
                    disabled={Boolean(item.contentCount)}
                    title={
                      item.contentCount
                        ? "Existem conteúdos vinculados. Arquive em vez de excluir."
                        : `Excluir ${noun}`
                    }
                    className="rounded-xl text-xs font-extrabold text-[#9c583c]"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <ContentEmpty
          icon={ImageUp}
          title={`Nenhum ${noun} cadastrado`}
          text="Crie o primeiro item e envie sua capa oficial."
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-3xl bg-[var(--paper)]">
          <DialogHeader>
            <DialogTitle className="display-font text-3xl">
              {form.id ? "Editar" : "Novo"} {noun}
            </DialogTitle>
            <DialogDescription>Configure nome, capa, ordem e publicação.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                required
                minLength={2}
                value={form.name}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    name: e.target.value,
                    slug: c.id ? c.slug : slugifyPt(e.target.value),
                  }))
                }
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                required
                pattern="[a-z0-9-]+"
                value={form.slug}
                onChange={(e) => setForm((c) => ({ ...c, slug: slugifyPt(e.target.value) }))}
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                className="mt-2 min-h-24"
              />
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={image}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl border border-dashed border-[var(--line)] bg-white p-4 text-left"
            >
              <ImageUp size={18} />
              <strong className="mt-2 block text-sm">
                {form.coverImageUrl ? "Substituir capa" : "Enviar capa"}
              </strong>
              <span className="text-xs text-[var(--ink-soft)]">JPG, PNG ou WEBP · até 6 MB</span>
            </button>
            {form.coverImageUrl ? (
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={form.coverImageUrl}
                  alt="Prévia da capa"
                  decoding="async"
                  className="aspect-[4/3] w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((c) => ({ ...c, coverImageKey: null, coverImageUrl: null }))
                  }
                  className="absolute right-2 top-2 rounded-full bg-white p-2"
                >
                  <X size={15} />
                </button>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.position}
                  onChange={(e) => setForm((c) => ({ ...c, position: Number(e.target.value) }))}
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, status: e.target.value as Form["status"] }))
                  }
                  className="mt-2 h-11 w-full rounded-md border bg-white px-3"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  {kind === "module" ? <option value="coming_soon">Em breve</option> : null}
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>
            {kind === "module" && form.status === "coming_soon" ? (
              <div>
                <Label>Mensagem de “Em breve”</Label>
                <Textarea
                  required
                  maxLength={360}
                  value={form.comingSoonMessage ?? ""}
                  onChange={(e) => setForm((c) => ({ ...c, comingSoonMessage: e.target.value }))}
                  className="mt-2 min-h-24"
                />
                <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b5f16]">
                    Prévia para membros · Em breve
                  </p>
                  <h3 className="display-font mt-2 text-2xl font-semibold">
                    {form.name || "Nome do módulo"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {form.comingSoonMessage}
                  </p>
                </div>
              </div>
            ) : null}
            <Button
              disabled={save.isPending || upload.isPending}
              className="w-full rounded-xl bg-[var(--sage-deep)] font-extrabold text-white"
            >
              <Save size={16} className="mr-2" />
              Salvar {noun}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
