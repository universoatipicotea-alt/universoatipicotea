import type { CSSProperties } from "react";

const LOGO_URL = "/manus-storage/universo-atipico-logo-oficial_05f4c9c6.png";

const orbitDots = ["blue", "gold", "red", "green", "blue", "gold"] as const;

export function BrandOrbitHero() {
  return (
    <div className="brand-orbit-stage" aria-label="Identidade visual Universo Atípico">
      <div className="brand-orbit-glow" />
      <div className="brand-orbit-ring brand-orbit-ring-outer" aria-hidden="true">
        {orbitDots.map((color, index) => (
          <span
            key={`${color}-${index}`}
            className={`brand-orbit-dot brand-orbit-dot-${color}`}
            style={{ "--dot-index": index } as CSSProperties}
          />
        ))}
      </div>
      <div className="brand-orbit-ring brand-orbit-ring-inner" aria-hidden="true" />
      <span className="brand-orbit-star brand-orbit-star-one" aria-hidden="true">
        ✦
      </span>
      <span className="brand-orbit-star brand-orbit-star-two" aria-hidden="true">
        ✦
      </span>
      <div className="brand-orbit-logo-wrap">
        <img
          src={LOGO_URL}
          alt="Universo Atípico"
          className="brand-orbit-logo"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      <p className="brand-orbit-caption">Conhecimento que conecta. Apoio que transforma.</p>
    </div>
  );
}
