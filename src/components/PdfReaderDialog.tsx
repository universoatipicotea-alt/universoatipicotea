import { X } from "lucide-react";
import PdfReader from "@/components/PdfReaderClient";

export type ReaderDocument = {
  id: number;
  title: string;
  sourceType: "guide" | "testGuide";
};

export function PdfReaderDialog({
  document,
  onClose,
}: {
  document: ReaderDocument;
  onClose: () => void;
}) {
  const sourcePath = document.sourceType === "testGuide" ? "test-guide" : "guide";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,28,61,0.78)] p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Leitor: ${document.title}`}
    >
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">
              Leitor protegido
            </p>
            <h2 className="truncate text-sm font-extrabold sm:text-base">{document.title}</h2>
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--ink-soft)] transition hover:bg-[var(--linen)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
            aria-label="Fechar leitor"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-[#e9e7e3]">
          <PdfReader
            src={`/api/protected-pdf/${sourcePath}/${document.id}`}
            title={document.title}
            progressSource={document.sourceType}
            documentId={document.id}
          />
        </div>
        <p className="border-t border-[var(--line)] px-4 py-2 text-center text-xs text-[var(--ink-soft)]">
          Conteúdo protegido para leitura dentro da plataforma. Seu progresso é salvo
          automaticamente.
        </p>
      </div>
    </div>
  );
}

export default PdfReaderDialog;
