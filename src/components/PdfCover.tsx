import { BookOpen } from "lucide-react";
import { useState } from "react";

/**
 * Área de apresentação da capa (página 1 do PDF).
 * A imagem nunca é esticada: fica centralizada e contida na área,
 * preservando a proporção original do material.
 */
export function PdfCover({
  src,
  title,
  className = "",
  ratio = "3 / 4",
}: {
  src?: string | null;
  title: string;
  className?: string;
  ratio?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`relative grid w-full place-items-center overflow-hidden bg-[var(--linen)] px-4 py-5 ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={`Capa de ${title}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="max-h-full max-w-full object-contain drop-shadow-[0_10px_24px_rgba(8,31,77,.14)] transition duration-300"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-white/70 text-center">
          <BookOpen size={22} className="text-[var(--sage)]" />
          <p className="px-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage-deep)]">
            Universo Atípico
          </p>
          <p className="px-6 text-[11px] leading-4 text-[var(--ink-soft)]">Preparando a capa deste material…</p>
        </div>
      )}
    </div>
  );
}

export default PdfCover;
