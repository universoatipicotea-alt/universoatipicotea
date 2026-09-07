import { MemberShell } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ChefHat, Compass, ShieldCheck, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const benefits = [
  {
    icon: ChefHat,
    title: "Receitas práticas",
    text: "Ideias possíveis para diferentes momentos da rotina.",
    color: "bg-[#fff0dc] text-[#d65d29]",
  },
  {
    icon: Compass,
    title: "Academia Atípica",
    text: "Conhecimento organizado para aprender no seu ritmo.",
    color: "bg-[#e5f3ff] text-[#1785c9]",
  },
  {
    icon: BookOpen,
    title: "Guias",
    text: "Orientações práticas para consultar quando precisar.",
    color: "bg-[#e7f7ef] text-[#15987d]",
  },
  {
    icon: UsersRound,
    title: "Comunidade",
    text: "Trocas e apoio com quem entende a vida real.",
    color: "bg-[#ffe9e9] text-[#e2384d]",
  },
];

export default function Assinatura() {
  const [, setLocation] = useLocation();

  return (
    <MemberShell
      allowGuest
      eyebrow="Plano Universo"
      title="Tudo o que você precisa, em um só lugar."
      description="Receitas, conhecimento e comunidade para apoiar a rotina de famílias atípicas."
    >
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#d9e3ef] bg-[#fffaf2] px-5 py-7 shadow-[0_24px_70px_rgba(8,31,77,.10)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 -z-10 h-56 w-56 rounded-full bg-[#0a2d63]/[0.06]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -right-20 -z-10 h-72 w-72 rounded-full bg-[#65cdbf]/15 blur-2xl"
        />

        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.75fr)] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[#e9f4fb] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#284e78]">
              Plano Universo
            </span>

            <h2 className="display-font mt-5 max-w-xl text-[clamp(2rem,8vw,4.4rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[#082c62]">
              Um Universo inteiro por
            </h2>

            <p
              aria-label="R$ 49,90 por mês"
              className="mt-4 flex flex-nowrap items-end gap-2 whitespace-nowrap text-[#ff5b45]"
            >
              <strong className="display-font text-[clamp(3.15rem,14vw,6.25rem)] font-semibold leading-none tracking-[-0.065em]">
                R$ 49,90
              </strong>
              <span className="mb-[0.42em] text-[clamp(1rem,4.2vw,1.75rem)] font-extrabold text-[#082c62]">
                /mês
              </span>
            </p>

            <p className="mt-5 max-w-xl text-sm font-bold leading-7 text-[#405979] sm:text-base">
              Receitas <span className="text-[#f4aa27]">•</span> Academia Atípica{" "}
              <span className="text-[#46b9ac]">•</span> Guias{" "}
              <span className="text-[#ef6268]">•</span> Comunidade
            </p>

            <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-2xl border border-[#cfe8dc] bg-[#edf8f2] px-4 py-3 text-sm font-extrabold text-[#0a5c4e] sm:text-base">
              <span aria-hidden="true">🌱</span>
              <span>Menos de R$ 1,67 por dia</span>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="min-w-0 rounded-2xl border border-[#e3e8ef] bg-white/90 p-3 shadow-[0_8px_20px_rgba(8,31,77,.05)] sm:p-4"
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl ${item.color}`}
                      aria-hidden="true"
                    >
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <h3 className="mt-3 text-xs font-extrabold leading-tight text-[#082c62] sm:text-sm">
                      {item.title}
                    </h3>
                    <p className="mt-1 hidden text-xs leading-5 text-[#52647d] sm:block">
                      {item.text}
                    </p>
                  </article>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={() => setLocation("/checkout")}
              className="pressable mt-7 h-14 w-full rounded-2xl bg-[#082c62] px-5 text-xs font-extrabold tracking-[0.05em] text-white shadow-[0_14px_30px_rgba(8,44,98,.24)] hover:bg-[#061f46] sm:h-16 sm:max-w-md sm:text-sm"
            >
              QUERO FAZER PARTE <ArrowRight size={18} className="ml-2" />
            </Button>
            <p className="mt-3 text-center text-xs font-semibold text-[#52647d] sm:max-w-md">
              Cancele quando quiser.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-[#52647d]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-[#15987d]" /> Pagamento seguro
              </span>
              <span>Acesso em qualquer dispositivo</span>
            </div>
          </div>

          <figure className="min-w-0 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_22px_55px_rgba(8,31,77,.14)]">
            <img
              src="/plano-universo-oferta.png"
              alt="Apresentação visual do Plano Universo com receitas, Academia Atípica, guias e comunidade"
              className="aspect-[4/5] h-full w-full object-cover object-top sm:aspect-[3/4] lg:max-h-[760px]"
              loading="eager"
              decoding="async"
            />
          </figure>
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-[var(--linen)] p-7 sm:p-9">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--clay)]">
          Já faz parte?
        </p>
        <h2 className="display-font mt-3 max-w-2xl text-3xl font-semibold leading-tight">
          Continue explorando tudo o que está incluído na sua assinatura.
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => setLocation("/biblioteca")}
            className="pressable rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"
          >
            Ver a biblioteca <ArrowRight size={14} className="ml-2" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/receitas")}
            className="pressable rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]"
          >
            Explorar receitas <ChefHat size={14} className="ml-2" />
          </Button>
        </div>
      </section>
    </MemberShell>
  );
}
