import { useAuth } from "@/_core/hooks/useAuth";
import { MemberShell } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { call, trpc } from "@/lib/trpc";
import { ArrowRight, Check, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const benefits = [
  "Receitas completas para a rotina",
  "Academia Atípica",
  "Comunidade e trocas entre famílias",
  "Guias complementares exclusivos",
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const params = useMemo(
    () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)),
    [],
  );
  const status = params.get("status");
  const sessionId = params.get("session_id");
  const isSuccess = status === "sucesso";

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const sync = trpc.billing.sync.useMutation();

  const sessionInfo = trpc.billing.session.useQuery(
    { sessionId },
    { enabled: Boolean(isSuccess && sessionId) },
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    if (sessionInfo.data?.email && !email) setEmail(sessionInfo.data.email);
  }, [sessionInfo.data?.email]);

  // Já logado voltando do pagamento: apenas sincroniza a assinatura.
  useEffect(() => {
    if (!isSuccess || !user || linked) return;
    sync
      .mutateAsync({ sessionId })
      .then(() => {
        setLinked(true);
        toast.success("Assinatura ativada!");
      })
      .catch((error: Error) => toast.error(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, user?.id]);

  const startCheckout = () => createCheckout.mutate({});

  const createAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2) return toast.error("Informe seu nome.");
    if (password.length < 8) return toast.error("A senha precisa ter pelo menos 8 caracteres.");
    setCreating(true);
    try {
      await call("billing.activate", { sessionId, name: name.trim(), password });
      await call("auth.login", { email: email.trim(), password });
      setLinked(true);
      toast.success("Conta criada e acesso liberado!");
      setLocation("/inicio");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const ctaLabel = createCheckout.isPending ? "Abrindo pagamento seguro..." : "Pagar agora — R$ 49,90/mês";

  return (
    <MemberShell
      allowGuest
      eyebrow="Assinatura"
      title="Comece sua jornada no Universo."
      description="Um acesso mais completo para encontrar receitas, caminhos e companhia para a vida real."
    >
      <div className="mx-auto max-w-6xl pb-24 lg:pb-0">
        {status === "cancelado" ? (
          <div className="mb-6 rounded-2xl border border-[#e4b9a4] bg-[#fdf3ee] p-5 text-sm font-semibold text-[#8e5744]">
            O pagamento foi cancelado. Você pode tentar novamente quando quiser.
          </div>
        ) : null}

        {isSuccess ? (
          <section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(8,31,77,.08)] sm:p-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--sage-pale)] text-[var(--sage-deep)]">
              <Check size={28} />
            </span>
            <p className="mt-6 text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage-deep)]">
              Pagamento confirmado
            </p>

            {user || linked ? (
              <>
                <h2 className="display-font mt-3 text-center text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)]">
                  Seu acesso está liberado.
                </h2>
                <Button
                  type="button"
                  onClick={() => setLocation("/comunidade")}
                  className="pressable mt-8 h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
                >
                  Ir para minha área <ArrowRight size={17} className="ml-2" />
                </Button>
              </>
            ) : (
              <>
                <h2 className="display-font mt-3 text-center text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)]">
                  Agora crie sua conta.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-center text-sm leading-7 text-[var(--ink-soft)]">
                  Use o mesmo e-mail do pagamento para vincular sua assinatura automaticamente.
                </p>
                <form onSubmit={createAccount} className="mt-8 space-y-4">
                  <label className="block text-sm font-extrabold text-[var(--ink)]">
                    Nome
                    <input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Como podemos chamar você?"
                      className="mt-2 h-13 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 text-sm font-medium outline-none transition focus:border-[var(--sage)] focus:bg-white"
                    />
                  </label>
                  <label className="block text-sm font-extrabold text-[var(--ink)]">
                    E-mail
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="mt-2 h-13 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 text-sm font-medium outline-none transition focus:border-[var(--sage)] focus:bg-white"
                    />
                  </label>
                  <label className="block text-sm font-extrabold text-[var(--ink)]">
                    Senha
                    <input
                      required
                      type="password"
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      className="mt-2 h-13 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 text-sm font-medium outline-none transition focus:border-[var(--sage)] focus:bg-white"
                    />
                  </label>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="pressable h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
                  >
                    {creating ? "Criando sua conta..." : <>Criar conta e acessar <ArrowRight size={17} className="ml-2" /></>}
                  </Button>
                </form>
                <p className="mt-4 text-center text-xs font-medium text-[var(--ink-soft)]">
                  Já tem conta?{" "}
                  <button type="button" onClick={() => setLocation(`/entrar?next=/checkout?status=sucesso`)} className="font-extrabold text-[var(--sage-deep)] underline">
                    Entrar
                  </button>
                </p>
              </>
            )}
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(8,31,77,.08)] sm:p-9">
              {/* Preço e CTA no topo, sem rolagem */}
              <div className="relative overflow-hidden rounded-[1.5rem] bg-[var(--ink)] p-6 text-white sm:p-7">
                <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[var(--clay)]/80" aria-hidden="true" />
                <div className="relative flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#efd4a2]">Plano Universo</p>
                    <p className="display-font mt-2 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
                      R$ 49,90
                      <span className="ml-1 font-sans text-sm font-bold tracking-normal text-white/65">/mês</span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-white/65">Cancele quando quiser.</p>
                  </div>
                  <span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#efd4a2]">
                    Assinatura mensal
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={startCheckout}
                disabled={createCheckout.isPending}
                className="pressable mt-5 h-14 w-full rounded-2xl bg-[var(--sage-deep)] text-base font-extrabold text-white shadow-[0_12px_28px_rgba(55,95,74,.28)] hover:bg-[var(--ink)]"
              >
                {createCheckout.isPending ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
                    {ctaLabel}
                  </>
                ) : (
                  <>
                    Pagar agora <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
              <p className="mt-3 text-center text-xs font-medium text-[var(--ink-soft)]">
                Pagamento seguro pelo Stripe · você cria sua conta logo após o pagamento.
              </p>

              <div className="mt-8 grid gap-3 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
                {benefits.map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm font-bold text-[var(--ink-soft)]">
                    <Check size={16} className="shrink-0 text-[var(--sage)]" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <aside className="relative hidden overflow-hidden rounded-[2rem] bg-[var(--sage-deep)] p-7 text-white shadow-[0_24px_60px_rgba(55,95,74,.18)] lg:block">
              <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[var(--sage)]/45" aria-hidden="true" />
              <div className="relative flex h-full flex-col">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#efd4a2]">
                  <LockKeyhole size={20} />
                </span>
                <h2 className="display-font mt-8 text-3xl font-semibold leading-[.98] tracking-[-.03em]">
                  Um acesso feito para a vida real.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/75">
                  Receitas, jornadas e trocas com outras famílias em um só lugar — com mais calma e menos ruído.
                </p>
                <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
                  <p className="flex items-start gap-2 text-xs font-bold text-white/80">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#efd4a2]" /> Seus dados de pagamento ficam com o Stripe.
                  </p>
                  <p className="flex items-start gap-2 text-xs font-bold text-white/80">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-[#efd4a2]" /> Cancele quando quiser em Minha assinatura.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Barra fixa de conversão no mobile */}
      {!isSuccess ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 p-3 backdrop-blur lg:hidden">
          <Button
            type="button"
            onClick={startCheckout}
            disabled={createCheckout.isPending}
            className="pressable h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
          >
            {createCheckout.isPending ? "Abrindo pagamento..." : ctaLabel}
          </Button>
        </div>
      ) : null}
    </MemberShell>
  );
}
