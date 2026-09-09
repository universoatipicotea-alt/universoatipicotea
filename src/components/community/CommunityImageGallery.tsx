import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useEffect, useState } from "react";
import type { CommunityAttachment } from "./types";

type CommunityImageGalleryProps = {
  attachments: CommunityAttachment[];
  title: string;
  compact?: boolean;
};

export function CommunityImageGallery({
  attachments,
  title,
  compact = false,
}: CommunityImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : attachments[activeIndex];

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= attachments.length) setActiveIndex(null);
  }, [activeIndex, attachments.length]);

  if (!attachments.length) return null;

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => {
      if (current === null) return 0;
      return (current + direction + attachments.length) % attachments.length;
    });
  };

  return (
    <>
      <div
        className={`mt-5 grid overflow-hidden rounded-2xl bg-[var(--linen)] ${
          attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
        } ${compact ? "max-h-72" : "max-h-[34rem]"}`}
        aria-label={`${attachments.length} ${attachments.length === 1 ? "imagem" : "imagens"} da publicação`}
      >
        {attachments.slice(0, 4).map((attachment, index) => (
          <button
            key={attachment.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`group relative min-h-32 overflow-hidden border border-white/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sage)]/40 ${
              attachments.length === 3 && index === 0 ? "row-span-2" : ""
            }`}
            aria-label={`Ampliar imagem ${index + 1} de ${attachments.length}`}
          >
            <img
              src={attachment.url}
              alt={attachment.altText || `Imagem ${index + 1} da publicação ${title}`}
              loading="lazy"
              decoding="async"
              className="h-full min-h-32 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            <span className="absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full bg-[var(--ink)]/80 text-white opacity-90 shadow-lg transition group-hover:bg-[var(--ink)]">
              <Expand size={18} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-5xl flex-col border-white/20 bg-[var(--ink)] p-3 text-white sm:p-5">
          <DialogTitle className="pr-10 text-base text-white">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Visualização ampliada das imagens da publicação. Use os botões anterior e próxima.
          </DialogDescription>
          {active ? (
            <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-xl bg-black/20">
              <img
                src={active.url}
                alt={active.altText || `Imagem ${(activeIndex ?? 0) + 1} da publicação ${title}`}
                className="max-h-[calc(100dvh-9rem)] w-auto max-w-full object-contain"
              />
              {attachments.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => move(-1)}
                    className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-black/65 text-white shadow-lg transition hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={24} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(1)}
                    className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-black/65 text-white shadow-lg transition hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={24} aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          <p className="text-center text-xs text-white/75" aria-live="polite">
            Imagem {(activeIndex ?? 0) + 1} de {attachments.length}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
