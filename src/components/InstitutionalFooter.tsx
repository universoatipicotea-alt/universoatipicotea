import { Link } from "@tanstack/react-router";

export const institutionalLinks = [
  { to: "/privacidade", label: "Política de Privacidade" },
  { to: "/termos", label: "Termos de Uso" },
  { to: "/aviso-de-responsabilidade", label: "Aviso de Responsabilidade" },
  { to: "/assinatura-e-cancelamento", label: "Política de Assinatura e Cancelamento" },
] as const;

export function InstitutionalFooter({ tone = "light" }: { tone?: "light" | "dark" }) {
  const base =
    tone === "dark"
      ? "text-white/65 hover:text-white"
      : "text-[var(--ink-soft)] hover:text-[var(--ink)]";
  return (
    <div
      className={`border-t ${tone === "dark" ? "border-white/10" : "border-[var(--line)]"} pt-6`}
    >
      <p
        className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${tone === "dark" ? "text-white/45" : "text-[var(--ink-soft)]"}`}
      >
        Institucional
      </p>
      <nav
        className="mt-3 flex flex-wrap gap-x-6 gap-y-2"
        aria-label="Links institucionais"
      >
        {institutionalLinks.map((item) => (
          <Link key={item.to} to={item.to} className={`text-xs font-bold ${base}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      <p
        className={`mt-4 text-xs ${tone === "dark" ? "text-white/45" : "text-[var(--ink-soft)]"}`}
      >
        Universo Atípico · assinatura R$ 49,90/mês com acesso completo à plataforma. Conteúdos
        informativos e educacionais, que não substituem avaliação profissional.
      </p>
    </div>
  );
}
