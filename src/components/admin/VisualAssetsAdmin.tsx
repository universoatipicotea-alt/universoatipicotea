import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  ImageUp,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Tablet,
} from "lucide-react";
import { toast } from "sonner";
import { ContentEmpty, SectionHeading } from "@/components/MemberShell";
import ResponsiveVisualAsset from "@/components/ResponsiveVisualAsset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  resolveVisualAssetSources,
  VISUAL_ASSET_SLOT_DEFINITIONS,
  VISUAL_ASSET_SLOTS,
  type VisualAssetSlot,
} from "@/lib/visual-assets";

type ImageVariant = "desktop" | "tablet" | "mobile";

type VisualAssetRecord = {
  id: number;
  slot: VisualAssetSlot;
  name: string;
  internalTitle: string;
  desktopImageKey: string | null;
  desktopImageUrl: string;
  tabletImageKey: string | null;
  tabletImageUrl: string | null;
  mobileImageKey: string | null;
  mobileImageUrl: string | null;
  altText: string;
  isActive: boolean;
  updatedAt?: string | null;
};

type VisualAssetForm = Omit<VisualAssetRecord, "id" | "updatedAt"> & { id?: number };

const variantMeta: Record<
  ImageVariant,
  {
    label: string;
    icon: typeof Monitor;
    keyField: "desktopImageKey" | "tabletImageKey" | "mobileImageKey";
    urlField: "desktopImageUrl" | "tabletImageUrl" | "mobileImageUrl";
  }
> = {
  desktop: {
    label: "Desktop",
    icon: Monitor,
    keyField: "desktopImageKey",
    urlField: "desktopImageUrl",
  },
  tablet: {
    label: "Tablet",
    icon: Tablet,
    keyField: "tabletImageKey",
    urlField: "tabletImageUrl",
  },
  mobile: {
    label: "Mobile",
    icon: Smartphone,
    keyField: "mobileImageKey",
    urlField: "mobileImageUrl",
  },
};

function emptyForm(slot: VisualAssetSlot): VisualAssetForm {
  const definition = VISUAL_ASSET_SLOT_DEFINITIONS[slot];
  return {
    slot,
    name: definition.label,
    internalTitle: `${definition.label} — imagem principal`,
    desktopImageKey: null,
    desktopImageUrl: "",
    tabletImageKey: null,
    tabletImageUrl: null,
    mobileImageKey: null,
    mobileImageUrl: null,
    altText: `Imagem de apoio — ${definition.label}`,
    isActive: true,
  };
}

async function asDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function fallbackLabel(form: VisualAssetForm, variant: ImageVariant) {
  if (form[variantMeta[variant].urlField]) return "Variante própria";
  if (variant === "mobile" && form.tabletImageUrl) return "Fallback do tablet";
  if (variant !== "desktop" && form.desktopImageUrl) return "Fallback do desktop";
  return "Imagem pendente";
}

export default function VisualAssetsAdmin() {
  const utils = trpc.useUtils();
  const query = trpc.community.master.visualAssets.useQuery();
  const upload = trpc.community.files.uploadContentImage.useMutation();
  const save = trpc.community.master.saveVisualAsset.useMutation();
  const [slot, setSlot] = useState<VisualAssetSlot>("inicio");
  const [uploadingVariant, setUploadingVariant] = useState<ImageVariant | null>(null);
  const records = (query.data ?? []) as VisualAssetRecord[];
  const currentRecord = records.find((item) => item.slot === slot);
  const [form, setForm] = useState<VisualAssetForm>(() => emptyForm("inicio"));

  useEffect(() => {
    setForm(currentRecord ? { ...currentRecord } : emptyForm(slot));
  }, [currentRecord, slot]);

  const definition = VISUAL_ASSET_SLOT_DEFINITIONS[slot];
  const resolvedPreview = useMemo(() => resolveVisualAssetSources(form), [form]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, variant: ImageVariant) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 6 * 1024 * 1024
    ) {
      toast.error("Envie JPG, PNG ou WEBP com até 6 MB.");
      return;
    }
    const targetSlot = slot;
    setUploadingVariant(variant);
    try {
      const result = await upload.mutateAsync({
        fileName: file.name,
        dataUrl: await asDataUrl(file),
      });
      const meta = variantMeta[variant];
      setForm((value) =>
        value.slot === targetSlot
          ? {
              ...value,
              [meta.keyField]: result.key,
              [meta.urlField]: result.url,
            }
          : value,
      );
      toast.success(`${meta.label}: imagem enviada. Salve para publicar a configuração.`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploadingVariant(null);
    }
  };

  const removeOptionalVariant = (variant: Exclude<ImageVariant, "desktop">) => {
    const meta = variantMeta[variant];
    setForm((value) => ({ ...value, [meta.keyField]: null, [meta.urlField]: null }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync(form);
      await Promise.all([
        utils.community.master.visualAssets.invalidate(),
        utils.community.visualAssets.active.invalidate(),
      ]);
      toast.success("Configuração visual salva e registrada na auditoria.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <section>
      <SectionHeading label="Aparência" title="Conteúdo visual responsivo" />
      <p className="-mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
        Troque banners sem editar código. O navegador recebe a variante adequada e aplica fallback
        de mobile para tablet e, por último, desktop.
      </p>

      <div className="mt-7 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Slots visuais" className="space-y-2">
          {VISUAL_ASSET_SLOTS.map((itemSlot) => {
            const item = VISUAL_ASSET_SLOT_DEFINITIONS[itemSlot];
            const saved = records.find((record) => record.slot === itemSlot);
            const active = itemSlot === slot;
            return (
              <button
                key={itemSlot}
                type="button"
                onClick={() => setSlot(itemSlot)}
                disabled={uploadingVariant !== null || save.isPending}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-[var(--sage-deep)] bg-[var(--sage-deep)] text-white"
                    : "border-[var(--line)] bg-white hover:bg-[var(--linen)]"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    active ? "bg-white/10" : "bg-[var(--paper)] text-[var(--sage-deep)]"
                  }`}
                >
                  <ImageUp size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-xs font-extrabold">{item.label}</strong>
                  <small
                    className={`mt-1 block text-[10px] ${active ? "text-white/70" : "text-[var(--ink-soft)]"}`}
                  >
                    {saved
                      ? saved.isActive
                        ? "Configurado e ativo"
                        : "Configurado e inativo"
                      : "Usando fallback local"}
                  </small>
                </span>
              </button>
            );
          })}
        </nav>

        <form onSubmit={submit} className="min-w-0 space-y-6">
          <article className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">
                  {definition.route}
                </p>
                <h3 className="display-font mt-2 text-2xl font-semibold">{definition.label}</h3>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--ink-soft)]">
                  {definition.description}
                </p>
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full bg-[var(--paper)] px-4 text-xs font-extrabold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, isActive: event.target.checked }))
                  }
                  className="h-4 w-4 accent-[var(--sage-deep)]"
                />
                {form.isActive ? "Ativo" : "Inativo"}
              </label>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="visual-name">Nome</Label>
                <Input
                  id="visual-name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="visual-internal-title">Título interno</Label>
                <Input
                  id="visual-internal-title"
                  required
                  maxLength={160}
                  value={form.internalTitle}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, internalTitle: event.target.value }))
                  }
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="visual-alt">Texto alternativo</Label>
                <Input
                  id="visual-alt"
                  required
                  maxLength={240}
                  value={form.altText}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, altText: event.target.value }))
                  }
                  className="mt-2 h-11 rounded-xl"
                  aria-describedby="visual-alt-help"
                />
                <p id="visual-alt-help" className="mt-2 text-xs text-[var(--ink-soft)]">
                  Descreva o conteúdo útil da imagem; não repita preço, headline ou CTA.
                </p>
              </div>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-3">
            {(Object.keys(variantMeta) as ImageVariant[]).map((variant) => {
              const meta = variantMeta[variant];
              const Icon = meta.icon;
              const ownUrl = form[meta.urlField];
              const effectiveUrl = resolvedPreview[variant];
              return (
                <article
                  key={variant}
                  className="min-w-0 overflow-hidden rounded-3xl border border-[var(--line)] bg-white"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[var(--linen)]">
                    {effectiveUrl ? (
                      <img
                        src={effectiveUrl}
                        alt={`Prévia ${meta.label.toLowerCase()}: ${form.altText}`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-5 text-center text-xs font-bold text-[var(--ink-soft)]">
                        Envie a variante desktop para habilitar a prévia.
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-extrabold">
                        <Icon size={16} className="text-[var(--sage-deep)]" /> Imagem{" "}
                        {meta.label.toLowerCase()}
                      </span>
                      <span className="rounded-full bg-[var(--paper)] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                        {fallbackLabel(form, variant)}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
                      Recomendado: {definition.recommended[variant]}
                    </p>
                    <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--paper)]">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => handleUpload(event, variant)}
                        disabled={uploadingVariant !== null}
                      />
                      {uploadingVariant === variant ? (
                        <Loader2 size={15} className="mr-2 animate-spin" />
                      ) : (
                        <ImageUp size={15} className="mr-2" />
                      )}
                      {ownUrl ? "Substituir" : "Enviar imagem"}
                    </label>
                    {variant !== "desktop" && ownUrl ? (
                      <button
                        type="button"
                        onClick={() => removeOptionalVariant(variant)}
                        className="mt-3 min-h-10 w-full text-xs font-bold text-[var(--ink-soft)] underline underline-offset-4"
                      >
                        Remover e usar fallback
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <article className="rounded-3xl border border-[var(--line)] bg-[var(--ink)] p-5 text-white sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Eye size={17} className="text-[#efd4a2]" />
              <h3 className="text-sm font-extrabold">Prévia responsiva com fallback</h3>
            </div>
            {resolvedPreview.desktop ? (
              <ResponsiveVisualAsset
                slot={slot}
                assetOverride={form}
                defaultAlt={form.altText}
                className="max-h-[420px] w-full rounded-2xl bg-white object-contain"
              />
            ) : (
              <ContentEmpty
                icon={ImageUp}
                title="Prévia aguardando imagem"
                text="A variante desktop é obrigatória; tablet e mobile são opcionais."
              />
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-white/70">
              <span className="rounded-full bg-white/10 px-3 py-1.5">
                Mobile usa mobile → tablet → desktop
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">Sem deformação</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">
                Copy principal permanece em HTML
              </span>
            </div>
          </article>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <CheckCircle2 size={16} className="text-[var(--sage-deep)]" />
              Salvar não exclui nenhuma imagem anterior do storage.
            </p>
            <Button
              type="submit"
              disabled={save.isPending || upload.isPending || !form.desktopImageUrl}
              className="min-h-11 rounded-xl bg-[var(--sage-deep)] px-5 font-extrabold text-white"
            >
              {save.isPending ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Salvar configuração
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
