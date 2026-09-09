import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_IMAGE_MIME_TYPES,
  COMMUNITY_MAX_IMAGE_BYTES,
  COMMUNITY_MAX_IMAGES,
} from "@shared/community";
import { ImagePlus, Loader2, ShieldCheck, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { readFileAsDataUrl } from "./community-utils";

type PendingImage = {
  localId: string;
  file: File;
  previewUrl: string;
  attachmentId?: number;
  status: "uploading" | "ready" | "error";
};

type CommunityComposerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (topicId: number) => Promise<void> | void;
};

function newRequestId() {
  return crypto.randomUUID();
}

export function CommunityComposer({ open, onOpenChange, onCreated }: CommunityComposerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof COMMUNITY_CATEGORIES)[number]>("Rotina");
  const [images, setImages] = useState<PendingImage[]>([]);
  const [requestId, setRequestId] = useState(newRequestId);
  const uploadImage = trpc.community.forum.uploadImage.useMutation();
  const deleteImage = trpc.community.forum.deleteImage.useMutation();
  const createTopic = trpc.community.forum.createTopic.useMutation();

  useEffect(
    () => () => {
      for (const image of images) URL.revokeObjectURL(image.previewUrl);
    },
    // URLs are also revoked when individual previews are removed/reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const reset = () => {
    for (const image of images) URL.revokeObjectURL(image.previewUrl);
    setTitle("");
    setBody("");
    setCategory("Rotina");
    setImages([]);
    setRequestId(newRequestId());
    if (fileInput.current) fileInput.current.value = "";
  };

  const discardStaged = async () => {
    const staged = images.flatMap((image) => (image.attachmentId ? [image.attachmentId] : []));
    await Promise.allSettled(
      staged.map((attachmentId) => deleteImage.mutateAsync({ attachmentId })),
    );
  };

  const close = async () => {
    if (createTopic.isPending) return;
    await discardStaged();
    reset();
    onOpenChange(false);
  };

  const upload = async (pending: PendingImage) => {
    try {
      const dataUrl = await readFileAsDataUrl(pending.file);
      const result = (await uploadImage.mutateAsync({
        fileName: pending.file.name,
        dataUrl,
        altText: `Imagem anexada à conversa ${title || "da comunidade"}`,
      })) as { id: number };
      setImages((current) =>
        current.map((item) =>
          item.localId === pending.localId
            ? { ...item, attachmentId: Number(result.id), status: "ready" }
            : item,
        ),
      );
    } catch (error) {
      setImages((current) =>
        current.map((item) =>
          item.localId === pending.localId ? { ...item, status: "error" } : item,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    }
  };

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const remaining = COMMUNITY_MAX_IMAGES - images.length;
    if (selected.length > remaining) {
      toast.error(`Você pode anexar até ${COMMUNITY_MAX_IMAGES} imagens.`);
    }
    for (const file of selected.slice(0, Math.max(remaining, 0))) {
      if (!(COMMUNITY_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
        toast.error(`${file.name}: use JPG, PNG ou WebP.`);
        continue;
      }
      if (file.size > COMMUNITY_MAX_IMAGE_BYTES) {
        toast.error(`${file.name}: a imagem deve ter no máximo 5 MB.`);
        continue;
      }
      const pending: PendingImage = {
        localId: newRequestId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
      };
      setImages((current) => [...current, pending]);
      void upload(pending);
    }
  };

  const removeImage = async (localId: string) => {
    const image = images.find((item) => item.localId === localId);
    if (!image) return;
    if (image.attachmentId) {
      try {
        await deleteImage.mutateAsync({ attachmentId: image.attachmentId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível remover a imagem.");
        return;
      }
    }
    URL.revokeObjectURL(image.previewUrl);
    setImages((current) => current.filter((item) => item.localId !== localId));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (images.some((image) => image.status === "uploading")) {
      toast.info("Aguarde o envio das imagens terminar.");
      return;
    }
    if (images.some((image) => image.status === "error")) {
      toast.error("Remova a imagem com erro antes de publicar.");
      return;
    }
    try {
      const result = (await createTopic.mutateAsync({
        title,
        body,
        category,
        clientRequestId: requestId,
        attachmentIds: images.flatMap((image) => (image.attachmentId ? [image.attachmentId] : [])),
      })) as { topicId: number };
      for (const image of images) URL.revokeObjectURL(image.previewUrl);
      setImages([]);
      setTitle("");
      setBody("");
      setRequestId(newRequestId());
      onOpenChange(false);
      toast.success("Conversa publicada.");
      await onCreated(Number(result.topicId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível publicar.");
    }
  };

  const uploadBusy = images.some((image) => image.status === "uploading");

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : void close())}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader>
          <DialogTitle className="display-font text-3xl">Abrir uma conversa</DialogTitle>
          <DialogDescription>
            Compartilhe experiências sem expor nomes, documentos ou dados pessoais de crianças.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label htmlFor="community-topic-title">Título</Label>
            <Input
              id="community-topic-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={5}
              maxLength={180}
              placeholder="Qual assunto você quer conversar?"
              className="mt-2 h-12"
              required
            />
          </div>
          <div>
            <Label htmlFor="community-topic-category">Tema</Label>
            <select
              id="community-topic-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as (typeof COMMUNITY_CATEGORIES)[number])
              }
              className="mt-2 h-12 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
            >
              {COMMUNITY_CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="community-topic-body">Mensagem</Label>
            <Textarea
              id="community-topic-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              minLength={10}
              maxLength={10_000}
              placeholder="Conte sua experiência, dúvida ou descoberta…"
              className="mt-2 min-h-40 resize-y"
              required
            />
            <p className="mt-1 text-right text-xs text-[var(--ink-soft)]" aria-live="polite">
              {body.length.toLocaleString("pt-BR")}/10.000
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--linen)]/55 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[var(--ink)]">Fotos opcionais</p>
                <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                  Até 4 imagens JPG, PNG ou WebP, com no máximo 5 MB cada.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={images.length >= COMMUNITY_MAX_IMAGES}
                className="min-h-11"
              >
                <ImagePlus className="mr-2" size={17} aria-hidden="true" />
                Adicionar fotos
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept={COMMUNITY_IMAGE_MIME_TYPES.join(",")}
                multiple
                className="sr-only"
                onChange={selectImages}
                aria-label="Selecionar fotos da conversa"
              />
            </div>
            {images.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
                {images.map((image) => (
                  <div
                    key={image.localId}
                    className="relative aspect-square overflow-hidden rounded-xl bg-white"
                  >
                    <img
                      src={image.previewUrl}
                      alt={`Prévia de ${image.file.name}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => void removeImage(image.localId)}
                      className="absolute right-1.5 top-1.5 grid h-10 w-10 place-items-center rounded-full bg-[var(--ink)]/85 text-white shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                      aria-label={`Remover ${image.file.name}`}
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                    <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/70 px-2 py-1 text-center text-[10px] font-bold text-white">
                      {image.status === "uploading"
                        ? "Enviando…"
                        : image.status === "error"
                          ? "Erro no envio"
                          : "Pronta"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-[#eef7f2] p-3 text-xs leading-5 text-[var(--sage-deep)]">
            <ShieldCheck className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
            As fotos ficam em armazenamento privado e são exibidas apenas a membros autorizados.
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => void close()}>
              Cancelar
            </Button>
            <Button className="min-h-12 sm:min-w-44" disabled={createTopic.isPending || uploadBusy}>
              {createTopic.isPending || uploadBusy ? (
                <Loader2 className="mr-2 animate-spin" size={17} aria-hidden="true" />
              ) : null}
              {createTopic.isPending
                ? "Publicando…"
                : uploadBusy
                  ? "Enviando fotos…"
                  : "Publicar conversa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
