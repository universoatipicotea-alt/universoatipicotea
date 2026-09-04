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
};
type Form = Omit<Item, "id" | "contentCount"> & { id?: number };
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
  const noun = kind === "recipe" ? "categoria" : "módulo";
  const items = useMemo(
    () =>
      ((kind === "recipe" ? query.data?.recipeCategories : query.data?.academyModules) ??
        []) as Item[],
    [kind, query.data],
  );
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
                    className="h-full w-full object-cover"
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
                <p className="mt-2 text-xs text-[var(--ink-soft)]">
                  {item.contentCount ?? 0} conteúdo(s) publicado(s) · /{item.slug}
                </p>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => edit(item)}
                    className="rounded-xl text-xs font-extrabold"
                  >
                    <Pencil size={14} className="mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => destroy(item)}
                    disabled={Boolean(item.contentCount)}
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
                  className="aspect-[4/3] w-full object-cover"
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
