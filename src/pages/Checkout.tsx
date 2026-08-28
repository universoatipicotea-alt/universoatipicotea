import { useAuth } from "@/_core/hooks/useAuth";
import { MemberShell } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const benefits = [
  "Receitas completas para a rotina",
  "Jornadas de aprendizagem",
  "Comunidade e trocas entre famílias",
  "Guias complementares exclusivos",
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [paid, setPaid] = useState(false);

  const params = useMemo(
    () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)),
    [],
  );
  const status = params.get("status");
  const sessionId = params.get("session_id");

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const sync = trpc.billing.sync.useMutation();

  useEffect(() => {
    if (status !== "sucesso" || !user) return;
    setSyncing(true);
    sync
      .mutateAsync({ sessionId })
      .then((result: { active: boolean }) => {
        setPaid(Boolean(result?.active));
        if (result?.active) toast.success("Assinatura ativada!");
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id]);

  const startCheckout = () => {
    if (!user) {
      setLocation("/entrar?next=/checkout");
      return;
    }
    createCheckout.mutate({});
  };

  return (
    <MemberShell
      allowGuest
      eyebrow="Assinatura"
      title="Comece sua jornada no Universo."
      description="Um acesso mais completo para encontrar receitas, caminhos e companhia para a vida real."
    >
      <div className="mx-auto max-w-6xl">
        {status === "cancelado" ? (
          <div className="mb-6 rounded-2xl border border-[#e4b9a4] bg-[#fdf3ee] p-5 text-sm font-semibold text-[#8e5744]">
            O pagamento foi cancelado. Você pode tentar novamente quando quiser.
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
          <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(8,31,77,.08)]">
            {status === "sucesso" ? (
              <div className="p-6 text-center sm:p-10">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--sage-pale)] text-[var(--sage-deep)]">
                  <Check size={28} />
                </span>
                <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage-deep)]">
                  {syncing ? "Confirmando pagamento" : paid ? "Pagamento confirmado" : "Quase lá"}
                </p>
                <h2 className="display-font mt-3 text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)] sm:text-5xl">
                  {paid ? "Seu acesso está liberado." : "Estamos confirmando sua assinatura."}
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[var(--ink-soft)]">
                  {syncing
                    ? "Só um instante enquanto verificamos o pagamento com o provedor."
                    : paid
                      ? "Bem-vinda ao Plano Universo. Todo o conteúdo da comunidade já está disponível para você."
                      : "Se você acabou de pagar, aguarde alguns segundos e atualize esta página."}
                </p>
                <Button
                  type="button"
                  onClick={() => setLocation("/comunidade")}
                  disabled={syncing}
                  className="pressable mt-8 h-13 w-full max-w-md rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
                >
                  Ir para minha área <ArrowRight size={17} className="ml-2" />
                </Button>
              </div>
            ) : (
              <div className="p-6 sm:p-9 lg:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage-deep)]">
                  <Sparkles size={13} /> Acesso completo
                </span>
                <h2 className="display-font mt-6 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)] sm:text-5xl">
                  Mais possibilidades para a sua rotina.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
                  Um plano pensado para quem quer encontrar receitas, orientações e jornadas que respeitem o tempo e a
                  realidade de cada família.
                </p>

                <div className="relative mt-8 overflow-hidden rounded-[1.5rem] bg-[var(--ink)] p-6 text-white sm:p-7">
                  <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[var(--clay)]/80" aria-hidden="true" />
                  <div className="absolute -bottom-20 -left-8 h-48 w-48 rounded-full bg-[var(--sage)]/55" aria-hidden="true" />
                  <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#efd4a2]">Plano Universo</p>
                      <p className="display-font mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
                        R$ 49,90
                        <span className="ml-1 font-sans text-sm font-bold tracking-normal text-white/65">/mês</span>
                      </p>
                      <p className="mt-2 text-xs font-medium text-white/65">Cancele quando quiser.</p>
                    </div>
                    <span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#efd4a2]">
                      Assinatura mensal
                    </span>
                  </div>
                  <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                    {benefits.map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs font-bold text-white/80">
                        <Check size={14} className="shrink-0 text-[#efd4a2]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={startCheckout}
                  disabled={createCheckout.isPending}
                  className="pressable mt-8 h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
                >
                  {createCheckout.isPending ? (
                    <>
                      <span
                        className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                        aria-hidden="true"
                      />
                      Abrindo pagamento seguro...
                    </>
                  ) : user ? (
                    <>
                      Assinar por R$ 49,90/mês <ArrowRight size={17} className="ml-2" />
                    </>
                  ) : (
                    <>
                      Criar conta e assinar <ArrowRight size={17} className="ml-2" />
                    </>
                  )}
                </Button>
                <p className="mt-4 text-center text-xs font-medium text-[var(--ink-soft)]">
                  Pagamento processado com segurança pelo Stripe.
                </p>
              </div>
            )}
          </section>

          <aside className="relative overflow-hidden rounded-[2rem] bg-[var(--sage-deep)] p-7 text-white shadow-[0_24px_60px_rgba(55,95,74,.18)] sm:p-8">
            <div className="absolute -right-16 -top-14 h-48 w-48 rounded-full border border-white/10 bg-[var(--clay)]/55" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[var(--sage)]/45" aria-hidden="true" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#efd4a2]">
                  <LockKeyhole size={20} />
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/75">
                  Pagamento seguro
                </span>
              </div>
              <h2 className="display-font mt-8 text-3xl font-semibold leading-[.98] tracking-[-.03em] sm:text-4xl">
                Um acesso feito para a vida real.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/75">
                Você poderá explorar receitas, jornadas e trocas com outras famílias em um só lugar — com mais calma e
                menos ruído.
              </p>
              <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
                <p className="flex items-start gap-2 text-xs font-bold text-white/80">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#efd4a2]" /> Seus dados de pagamento ficam com o
                  Stripe.
                </p>
                <p className="flex items-start gap-2 text-xs font-bold text-white/80">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-[#efd4a2]" /> Cancele a qualquer momento em Minha
                  assinatura.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
