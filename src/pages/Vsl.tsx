import { useAuth } from "@/_core/hooks/useAuth";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Check, Lock, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const STORAGE_KEY = "ua_vsl_watched";

export default function Vsl() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: funnel, isLoading } = trpc.community.funnel.get.useQuery();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watched, setWatched] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  // Autoplay assim que o vídeo estiver disponível (mudo, por política dos navegadores)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const tryPlay = () => {
      void el.play().catch(() => {
        /* navegador bloqueou: o botão de play continua disponível */
      });
    };
    if (el.readyState >= 2) tryPlay();
    else el.addEventListener("loadeddata", tryPlay, { once: true });
    return () => el.removeEventListener("loadeddata", tryPlay);
  }, [funnel?.vslVideoPath]);

  const unmute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setMuted(false);
    void el.play().catch(() => {});
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setWatched(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const videoSrc = funnel?.vslVideoPath
    ? `/api/public/ua-video/${funnel.vslVideoPath}`
    : null;

  const handleEnded = () => {
    setWatched(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const benefits = [
    "Acesso à comunidade de famílias atípicas",
    "Materiais e guias organizados por tema",
    "Espaço seguro para trocas e perguntas",
  ];

  return (
    <div className="page-texture min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Brand />
          <Link
            href={isAuthenticated ? "/comunidade" : "/entrar"}
            className="text-sm font-extrabold text-[var(--ink)] hover:text-[var(--blue)]"
          >
            {isAuthenticated ? "Acessar" : "Entrar"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">
            Antes de fazer parte
          </p>
          <h1 className="display-font mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--ink)] sm:text-4xl lg:text-5xl">
            {isLoading ? "Carregando..." : (funnel?.headline ?? "Alimentação com mais possibilidades, sem pressão.")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--ink-soft)]">
            {isLoading ? "" : (funnel?.subheadline ?? "Uma comunidade de apoio, estratégias e materiais para famílias atípicas.")}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--ink)] shadow-[0_24px_60px_rgba(8,31,77,.12)]">
          <div className="relative aspect-video">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                autoPlay
                muted={muted}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controlsList="nodownload noplaybackrate nofullscreen"
                disablePictureInPicture
                preload="auto"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--ink)] text-white">
                <Play size={48} className="opacity-40" />
                <p className="mt-4 text-sm font-medium text-white/70">Vídeo em preparação.</p>
              </div>
            )}

            {isPlaying && muted && videoSrc && (
              <button
                type="button"
                onClick={unmute}
                className="absolute inset-0 flex items-end justify-center bg-transparent pb-8"
                aria-label="Ativar som"
              >
                <span className="flex items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-sm font-extrabold text-[var(--ink)] shadow-xl transition hover:scale-105">
                  <Volume2 size={18} /> Ativar som
                </span>
              </button>
            )}

            {!isPlaying && videoSrc && (
              <button
                type="button"
                onClick={() => videoRef.current?.play()}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
                aria-label="Reproduzir vídeo"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-[var(--ink)] shadow-xl transition hover:scale-105">
                  <Play size={28} className="ml-1" />
                </span>
              </button>
            )}
          </div>
        </div>

        <div
          className={`mt-10 transition-all duration-700 ${watched ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          aria-hidden={!watched}
        >
          <div className="rounded-[2rem] border border-[var(--line)] bg-white p-7 shadow-[0_24px_60px_rgba(8,31,77,.08)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
                  Próximo passo
                </p>
                <h2 className="display-font mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Seu acesso ao Universo Atípico
                </h2>
                <ul className="mt-5 space-y-3">
                  {benefits.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--ink-soft)]">
                      <Check size={18} className="mt-0.5 shrink-0 text-[var(--green)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <div className="rounded-2xl bg-[var(--linen)] px-6 py-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    Investimento
                  </p>
                  <p className="display-font mt-1 text-4xl font-semibold text-[var(--ink)]">
                    {funnel?.priceLabel ?? "R$ 49,90"}
                    <span className="ml-1 font-sans text-sm font-bold text-[var(--ink-soft)]">/mês</span>
                  </p>
                </div>
                <Button
                  onClick={() => setLocation("/checkout")}
                  className="pressable h-14 rounded-xl bg-[var(--sage-deep)] px-8 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(34,91,73,.18)] transition hover:-translate-y-0.5 hover:bg-[var(--ink)] hover:shadow-[0_16px_30px_rgba(34,91,73,.22)]"
                >
                  {funnel?.ctaLabel ?? "Começar agora"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {!watched && (
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-[var(--ink-soft)]">
            <Lock size={14} />
            O botão de compra será liberado ao final do vídeo.
          </div>
        )}
      </main>
    </div>
  );
}
