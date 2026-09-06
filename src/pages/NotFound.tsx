import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="page-texture flex min-h-screen w-full items-center justify-center px-5 py-10">
      <section className="soft-card w-full max-w-lg rounded-[2rem] p-8 text-center sm:p-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--sage-pale)]" />
            <AlertCircle className="relative h-16 w-16 text-[var(--sage-deep)]" />
          </div>
        </div>

        <h1 className="display-font mb-2 text-5xl font-semibold text-[var(--ink)]">404</h1>

        <h2 className="mb-4 text-xl font-extrabold text-[var(--ink)]">Página não encontrada</h2>

        <p className="mb-8 leading-relaxed text-[var(--ink-soft)]">
          O endereço pode ter mudado ou o conteúdo não está mais disponível.
        </p>

        <div id="not-found-button-group" className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleGoHome}
            className="pressable rounded-xl bg-[var(--sage-deep)] px-6 py-2.5 text-white hover:bg-[var(--ink)]"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </section>
    </div>
  );
}
