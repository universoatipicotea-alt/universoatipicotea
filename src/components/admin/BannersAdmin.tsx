import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ImageUp, Save, Trash2 } from "lucide-react";
import { BANNER_SLOTS } from "@/components/PlatformBanner";
import { SectionHeading } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

type Device = "desktopUrl" | "tabletUrl" | "mobileUrl";
const DEVICES: { key: Device; label: string; hint: string }[] = [
  { key: "desktopUrl", label: "Computador", hint: "a partir de 1024px" },
  { key: "tabletUrl", label: "Tablet", hint: "de 640px a 1023px" },
  { key: "mobileUrl", label: "Celular", hint: "até 639px" },
];

type BannerValues = { desktopUrl: string; tabletUrl: string; mobileUrl: string; altText: string };
const empty: BannerValues = { desktopUrl: "", tabletUrl: "", mobileUrl: "", altText: "" };

function BannerCard({
  slot,
  label,
  base,
  saved,
  onSaved,
}: {
  slot: string;
  label: string;
  base: string;
  saved: Partial<BannerValues> | null;
  onSaved: () => Promise<unknown>;
}) {
  const [values, setValues] = useState<BannerValues>(empty);
  const [uploading, setUploading] = useState<Device | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const upload = trpc.community.files.uploadContentImage.useMutation();
  const save = trpc.community.master.saveBanner.useMutation();

  useEffect(() => {
    setValues({
      desktopUrl: saved?.desktopUrl ?? "",
      tabletUrl: saved?.tabletUrl ?? "",
      mobileUrl: saved?.mobileUrl ?? "",
      altText: saved?.altText ?? "",
    });
  }, [saved?.desktopUrl, saved?.tabletUrl, saved?.mobileUrl, saved?.altText]);

  const pick = async (device: Device, file: File | undefined) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("Escolha uma imagem de até 4 MB.");
    setUploading(device);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        reader.readAsDataURL(file);
      });
      const result = await upload.mutateAsync({ fileName: file.name, dataUrl });
      setValues((current) => ({ ...current, [device]: result.url }));
      toast.success("Imagem enviada. Clique em salvar para publicar.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    try {
      await save.mutateAsync({ slot, ...values });
      await onSaved();
      toast.success(`Imagens de ${label} atualizadas.`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <article className="soft-card rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-extrabold">{label}</h3>
          <p className="truncate text-xs text-[var(--ink-soft)]">Padrão: {base}.webp</p>
        </div>
        <Button
          onClick={submit}
          disabled={save.isPending}
          className="pressable h-10 shrink-0 rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white"
        >
          {save.isPending ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Save size={14} className="mr-2" />
          )}
          Salvar
        </Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {DEVICES.map((device) => {
          const value = values[device.key];
          return (
            <div key={device.key} className="rounded-2xl border border-[var(--line)] p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">
                {device.label}
              </p>
              <p className="mt-1 text-[11px] text-[var(--ink-soft)]">{device.hint}</p>
              <div className="mt-3 grid aspect-[16/10] place-items-center overflow-hidden rounded-xl bg-[var(--linen)]">
                <img
                  src={value || `${base}${device.key === "mobileUrl" ? "-sm" : device.key === "tabletUrl" ? "-md" : ""}.webp`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </div>
              <input
                ref={(node) => {
                  inputs.current[device.key] = node;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => pick(device.key, event.target.files?.[0])}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => inputs.current[device.key]?.click()}
                  disabled={uploading === device.key}
                  className="pressable h-9 rounded-lg text-[11px] font-extrabold"
                >
                  {uploading === device.key ? (
                    <Loader2 size={13} className="mr-1 animate-spin" />
                  ) : (
                    <ImageUp size={13} className="mr-1" />
                  )}
                  Trocar
                </Button>
                {value ? (
                  <Button
                    variant="outline"
                    onClick={() => setValues((current) => ({ ...current, [device.key]: "" }))}
                    className="pressable h-9 rounded-lg text-[11px] font-extrabold text-[#a1543a]"
                  >
                    <Trash2 size={13} className="mr-1" /> Usar padrão
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Label htmlFor={`alt-${slot}`} className="text-xs font-extrabold">
          Descrição da imagem (acessibilidade)
        </Label>
        <Input
          id={`alt-${slot}`}
          value={values.altText}
          onChange={(event) =>
            setValues((current) => ({ ...current, altText: event.target.value }))
          }
          placeholder="Ex.: Receitas do Universo Atípico"
          className="mt-2 h-11 rounded-xl"
        />
      </div>
    </article>
  );
}

export function BannersAdmin() {
  const banners = trpc.community.banners.useQuery();
  const utils = trpc.useUtils();
  const rows = (banners.data as any[]) ?? [];
  return (
    <section>
      <SectionHeading
        label="Identidade visual"
        title="Banners e imagens da plataforma"
      />
      <p className="mb-6 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
        Troque as imagens principais sem mexer no código. Envie uma versão para cada tamanho de
        tela; se algum tamanho ficar vazio, a imagem padrão continua sendo usada.
      </p>
      <div className="grid gap-5">
        {BANNER_SLOTS.map((item) => (
          <BannerCard
            key={item.slot}
            slot={item.slot}
            label={item.label}
            base={item.base}
            saved={rows.find((row) => row.slot === item.slot) ?? null}
            onSaved={() => utils.community.banners.invalidate()}
          />
        ))}
      </div>
    </section>
  );
}
