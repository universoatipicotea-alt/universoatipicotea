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
        <div className="flex h-full w-full flex-col justify-between rounded-xl bg-[var(--academy-cream)] p-5 text-left">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[var(--blue)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--red)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--green)]" />
          </div>
          <p className="display-font max-w-[16rem] text-xl font-semibold leading-tight text-[var(--ink)]">{title}</p>
        </div>
      )}
    </div>
  );
}

export default PdfCover;
