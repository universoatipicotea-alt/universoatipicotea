/**
 * Geração da capa a partir da página 1 do PDF.
 *
 * Renderiza somente a primeira página em um canvas, preservando a proporção
 * original (inclusive páginas verticais 9:16), e devolve um dataURL em WebP
 * (com fallback para PNG) em resolução adequada para telas HiDPI.
 */

const TARGET_WIDTH = 1200; // ~2x da maior exibição do card

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export type PdfThumbnail = {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  extension: "webp" | "png";
};

export async function renderPdfCover(source: ArrayBuffer | Uint8Array): Promise<PdfThumbnail> {
  const pdfjs = await loadPdfjs();
  const data = source instanceof Uint8Array ? source : new Uint8Array(source);
  const document = await pdfjs.getDocument({ data }).promise;
  try {
    const page = await document.getPage(1);
    const base = page.getViewport({ scale: 1 });
    // escala única para largura e altura: a proporção nunca é alterada
    const scale = TARGET_WIDTH / base.width;
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a prévia do PDF.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport } as any).promise;

    let extension: "webp" | "png" = "webp";
    let dataUrl = canvas.toDataURL("image/webp", 0.9);
    if (!dataUrl.startsWith("data:image/webp")) {
      extension = "png";
      dataUrl = canvas.toDataURL("image/png");
    }
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      extension,
    };
  } finally {
    document.destroy?.();
  }
}

export async function renderPdfCoverFromFile(file: File) {
  return renderPdfCover(await file.arrayBuffer());
}

export async function renderPdfCoverFromUrl(url: string) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Não foi possível baixar o PDF para gerar a capa.");
  return renderPdfCover(await response.arrayBuffer());
}
