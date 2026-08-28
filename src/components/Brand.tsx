import { useState } from "react";
import { Link } from "wouter";

type BrandProps = {
  compact?: boolean;
  inverted?: boolean;
};

const officialLogoUrl = "/manus-storage/universo-atipico-logo-oficial_05f4c9c6.png";

export function Brand({ compact = false, inverted = false }: BrandProps) {
  const imageClass = compact ? "block h-12 w-auto max-w-[12rem] object-contain sm:h-14 sm:max-w-[15rem]" : "block h-20 w-auto max-w-[21rem] object-contain sm:h-24 sm:max-w-[25rem]";
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Link
      href="/inicio"
      className={`brand-constellation inline-flex items-center ${inverted ? "rounded-xl bg-white px-3 py-2" : ""}`}
      aria-label="Universo Atípico — página inicial"
    >
      {logoFailed ? <span className={`${compact ? "text-base" : "text-2xl"} font-black tracking-[-0.04em] text-[var(--sage-deep)]`}>Universo Atípico</span> : <img src={officialLogoUrl} alt="Universo Atípico" className={imageClass} loading="eager" decoding="async" onError={() => setLogoFailed(true)} />}
    </Link>
  );
}
