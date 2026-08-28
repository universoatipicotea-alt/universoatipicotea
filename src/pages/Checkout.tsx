import { useAuth } from "@/_core/hooks/useAuth";
import { MemberShell } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

const steps = ["Plano", "Seus dados", "Confirmação"];

const benefits = [
  "Receitas completas para a rotina",
  "Jornadas de aprendizagem",
  "Comunidade e trocas entre famílias",
  "Guias complementares exclusivos",
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const pause = (duration: number) => new Promise(resolve => window.setTimeout(resolve, duration));
  const continueToDetails = async () => {
    setIsTransitioning(true);
    await pause(220);
    setStep(2);
    setIsTransitioning(false);
  };
  const validateDetails = () => {
    const nextErrors: { name?: string; email?: string } = {};
    if (name.trim().length < 2) nextErrors.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Informe um e-mail válido.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const submitDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateDetails()) return;
    setIsTransitioning(true);
    await pause(520);
    setStep(3);
    setIsTransitioning(false);
  };

  return (
    <MemberShell
      allowGuest
      eyebrow="Assinatura"
      title="Comece sua jornada no Universo."
      description="Um acesso mais completo para encontrar receitas, caminhos e companhia para a vida real."
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[var(--line)] bg-white/80 p-4 shadow-[0_12px_28px_rgba(8,31,77,.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage-deep)]">Seu próximo passo</p>
            <p className="mt-1 text-sm font-bold text-[var(--ink)]">Plano Universo · R$ 49,90/mês</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)]" aria-label={`Etapa ${step} de ${steps.length}`}>
            {steps.map((label, index) => {
              const current = index + 1;
              const active = step === current;
              const completed = step > current;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs transition ${completed || active ? "bg-[var(--ink)] text-white" : "bg-[var(--linen)] text-[var(--ink-soft)]"}`} aria-current={active ? "step" : undefined}>
                    {completed ? <Check size={14} /> : current}
                  </span>
                  <span className={`hidden sm:inline ${active ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"}`}>{label}</span>
                  {current < steps.length ? <span className="mx-1 h-px w-5 bg-[var(--line)] sm:w-8" aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
          <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(8,31,77,.08)]">
            {step === 1 ? (
              <div className="p-6 sm:p-9 lg:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage-deep)]"><Sparkles size={13} /> Acesso completo</span>
                <h2 className="display-font mt-6 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)] sm:text-5xl">Mais possibilidades para a sua rotina.</h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">Um plano pensado para quem quer encontrar receitas, orientações e jornadas que respeitem o tempo e a realidade de cada família.</p>

                <div className="relative mt-8 overflow-hidden rounded-[1.5rem] bg-[var(--ink)] p-6 text-white sm:p-7">
                  <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[var(--clay)]/80" aria-hidden="true" />
                  <div className="absolute -bottom-20 -left-8 h-48 w-48 rounded-full bg-[var(--sage)]/55" aria-hidden="true" />
                  <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#efd4a2]">Plano Universo</p>
                      <p className="display-font mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">R$ 49,90<span className="ml-1 font-sans text-sm font-bold tracking-normal text-white/65">/mês</span></p>
                      <p className="mt-2 text-xs font-medium text-white/65">Acesso pensado para acompanhar sua jornada.</p>
                    </div>
                    <span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#efd4a2]">Próxima etapa</span>
                  </div>
                  <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                    {benefits.map(item => <div key={item} className="flex items-center gap-2 text-xs font-bold text-white/80"><Check size={14} className="shrink-0 text-[#efd4a2]" />{item}</div>)}
                  </div>
                </div>

                <Button type="button" onClick={continueToDetails} disabled={isTransitioning} className="pressable mt-8 h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]">{isTransitioning ? <><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />Preparando seus dados...</> : <>Continuar com o plano <ArrowRight size={17} className="ml-2" /></>}</Button>
                <p className="mt-4 text-center text-xs font-medium text-[var(--ink-soft)]">Você poderá revisar seus dados antes de concluir.</p>
              </div>
            ) : null}

            {step === 2 ? (
              <form onSubmit={submitDetails} noValidate className="p-6 sm:p-9 lg:p-10">
                <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-lg text-xs font-extrabold text-[var(--ink-soft)] outline-none transition hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--sage)]"><ArrowLeft size={14} /> Voltar ao plano</button>
                <h2 className="display-font mt-6 text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)] sm:text-5xl">Seus dados para começar.</h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">Conte como podemos chamar você. Esta etapa é apenas visual: nenhum dado será enviado para cobrança.</p>
                <div className="mt-8 space-y-5">
                  <label className="block text-sm font-extrabold text-[var(--ink)]">Nome completo<input aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "checkout-name-error" : undefined} required minLength={2} value={name} onChange={event => { setName(event.target.value); if (errors.name) setErrors(current => ({ ...current, name: undefined })); }} onBlur={validateDetails} className={`mt-2 h-13 w-full rounded-xl border bg-[var(--paper)] px-4 text-sm font-medium outline-none transition placeholder:text-[var(--ink-soft)]/55 focus:border-[var(--sage)] focus:bg-white focus:ring-4 focus:ring-[var(--sage)]/15 ${errors.name ? "border-[#c46b55] ring-2 ring-[#c46b55]/10" : "border-[var(--line)]"}`} placeholder="Como podemos chamar você?" />{errors.name ? <span id="checkout-name-error" className="mt-1.5 block text-xs font-semibold text-[#a84f3b]">{errors.name}</span> : null}</label>
                  <label className="block text-sm font-extrabold text-[var(--ink)]">E-mail<input aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "checkout-email-error" : undefined} required type="email" value={email} onChange={event => { setEmail(event.target.value); if (errors.email) setErrors(current => ({ ...current, email: undefined })); }} onBlur={validateDetails} className={`mt-2 h-13 w-full rounded-xl border bg-[var(--paper)] px-4 text-sm font-medium outline-none transition placeholder:text-[var(--ink-soft)]/55 focus:border-[var(--sage)] focus:bg-white focus:ring-4 focus:ring-[var(--sage)]/15 ${errors.email ? "border-[#c46b55] ring-2 ring-[#c46b55]/10" : "border-[var(--line)]"}`} placeholder="voce@exemplo.com" />{errors.email ? <span id="checkout-email-error" className="mt-1.5 block text-xs font-semibold text-[#a84f3b]">{errors.email}</span> : null}</label>
                </div>
                <p className="mt-5 min-h-5 text-xs font-semibold text-[#a84f3b]" aria-live="polite">{Object.values(errors).filter(Boolean).length ? "Revise os campos destacados para continuar." : ""}</p><Button type="submit" disabled={isTransitioning} className="pressable mt-3 h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]">{isTransitioning ? <><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />Revisando seus dados...</> : <>Revisar meu acesso <ArrowRight size={17} className="ml-2" /></>}</Button>
              </form>
            ) : null}

            {step === 3 ? (
              <div className="p-6 text-center sm:p-10">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--sage-pale)] text-[var(--sage-deep)]"><Check size={28} /></span>
                <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage-deep)]">Revisão concluída</p>
                <h2 className="display-font mt-3 text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)] sm:text-5xl">Tudo pronto para a próxima etapa.</h2>
                <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[var(--ink-soft)]">Seu interesse foi revisado visualmente. A cobrança ainda está desativada; quando o pagamento for conectado, esta etapa poderá avançar com segurança.</p>
                <div className="mx-auto mt-8 max-w-md rounded-2xl bg-[var(--linen)] p-5 text-left"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage-deep)]">Resumo do acesso</p><p className="mt-3 text-sm font-extrabold text-[var(--ink)]">Plano Universo · R$ 49,90/mês</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{name || "Seu nome"} · {email || "seu e-mail"}</p></div>
                <Button type="button" onClick={() => setLocation(user ? "/comunidade" : "/entrar?next=/comunidade")} className="pressable mt-8 h-13 w-full max-w-md rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]">{user ? "Voltar para minha área" : "Criar minha conta"} <ArrowRight size={17} className="ml-2" /></Button>
              </div>
            ) : null}
          </section>

          <aside className="relative overflow-hidden rounded-[2rem] bg-[var(--sage-deep)] p-7 text-white shadow-[0_24px_60px_rgba(55,95,74,.18)] sm:p-8">
            <div className="absolute -right-16 -top-14 h-48 w-48 rounded-full border border-white/10 bg-[var(--clay)]/55" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[var(--sage)]/45" aria-hidden="true" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#efd4a2]"><LockKeyhole size={20} /></span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/75">Sem cobrança</span></div>
              <h2 className="display-font mt-8 text-3xl font-semibold leading-[.98] tracking-[-.03em] sm:text-4xl">Um acesso feito para a vida real.</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">Você poderá explorar receitas, jornadas e trocas com outras famílias em um só lugar — com mais calma e menos ruído.</p>
              <div className="mt-auto space-y-4 border-t border-white/10 pt-6"><p className="flex items-start gap-2 text-xs font-bold text-white/80"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#efd4a2]" /> Seus dados ficam protegidos.</p><p className="flex items-start gap-2 text-xs font-bold text-white/80"><Sparkles size={16} className="mt-0.5 shrink-0 text-[#efd4a2]" /> Nenhuma cobrança é realizada nesta versão.</p></div>
            </div>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
