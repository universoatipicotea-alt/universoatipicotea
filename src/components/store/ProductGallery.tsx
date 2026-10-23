import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** The parent keys this component by product, so selection never leaks between routes. */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState<string>();
  const [failed, setFailed] = useState<string[]>([]);
  const [zoom, setZoom] = useState(false);
  const usable = [...new Set(images.map((src) => src.trim()).filter(Boolean))].filter(
    (src) => !failed.includes(src),
  );
  const current = selected && usable.includes(selected) ? selected : usable[0];
  const fail = (src: string) => setFailed((old) => (old.includes(src) ? old : [...old, src]));
  return (
    <section aria-label="Galeria do produto">
      <button
        type="button"
        className="store-gallery-main"
        disabled={!current}
        aria-label={`Ampliar imagem de ${title}`}
        onClick={() => setZoom(true)}
      >
        {current ? (
          <img
            key={current}
            src={current}
            alt={title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={() => fail(current)}
          />
        ) : (
          <span role="status" className="store-placeholder">
            As fotos estão indisponíveis no momento.
          </span>
        )}
        {current && <ZoomIn size={22} aria-hidden="true" />}
      </button>
      {usable.length > 1 && (
        <div className="store-thumbnails">
          {usable.map((src, i) => (
            <button
              type="button"
              key={src}
              aria-label={`Ver imagem ${i + 1}`}
              aria-pressed={current === src}
              onClick={() => setSelected(src)}
            >
              <img
                src={src}
                alt={`${title}, imagem ${i + 1}`}
                loading="lazy"
                decoding="async"
                onError={() => fail(src)}
              />
            </button>
          ))}
        </div>
      )}
      {current && (
        <p className="store-gallery-caption">
          Selecione uma imagem para ver os detalhes. Toque para ampliar.
        </p>
      )}
      {!current && (
        <button type="button" className="store-secondary" onClick={() => setFailed([])}>
          Tentar carregar fotos novamente
        </button>
      )}
      <Dialog open={zoom && Boolean(current)} onOpenChange={setZoom}>
        <DialogContent className="store-dialog store-zoom">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Imagem {usable.indexOf(current) + 1} de {usable.length}
          </DialogDescription>
          {current && <img src={current} alt={title} onError={() => fail(current)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
