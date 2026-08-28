import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

/** O leitor usa APIs do navegador: só carrega depois da hidratação. */
const PdfReader = lazy(() => import("./PdfReader"));

type Props = {
  src: string;
  title: string;
  progressKey?: string;
  progressSource?: "guide" | "testGuide";
  documentId?: number;
};

function Fallback() {
  return (
    <div className="mt-5 flex min-h-[420px] items-center justify-center gap-3 rounded-2xl border border-[var(--line)] bg-[#525252] text-sm font-semibold text-white/80">
      <Loader2 className="animate-spin" size={20} />
      Preparando o leitor…
    </div>
  );
}

export default function PdfReaderClient(props: Props) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <PdfReader {...props} />
      </Suspense>
    </ClientOnly>
  );
}
