import { trpc } from "@/lib/trpc";
import { MemberShell } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateLabel(value?: string | null) {
  if (!value) return "a data indicada pelo Stripe";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(value));
}

export default function MinhaAssinatura() {
  const [, setLocation] = useLocation();
  const [confirming, setConfirming] = useState(false);
  const [pendingRenewal, setPendingRenewal] = useState<{
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  } | null>(null);
  const subscription = trpc.community.subscription.me.useQuery();
  const utils = trpc.useUtils();
  const cancel = trpc.community.subscription.cancel.useMutation({
    onSuccess: async (result) => {
      setConfirming(false);
      setPendingRenewal({
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        currentPeriodEnd: result.currentPeriodEnd,
      });
      await utils.community.subscription.me.invalidate();
      toast.success(`Cancelamento agendado para ${dateLabel(result.currentPeriodEnd)}.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const resume = trpc.community.subscription.resume.useMutation({
    onSuccess: async (result) => {
      setPendingRenewal({
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        currentPeriodEnd: result.currentPeriodEnd,
      });
      await utils.community.subscription.me.invalidate();
      toast.success("Renovação reativada.");
    },
    onError: (error) => toast.error(error.message),
  });
  const data = subscription.data;
  const cancelAtPeriodEnd = pendingRenewal?.cancelAtPeriodEnd ?? data?.cancelAtPeriodEnd ?? false;
  const currentPeriodEnd = pendingRenewal?.currentPeriodEnd ?? data?.currentPeriodEnd ?? null;
  const statusLabel =
    data?.status === "member" && cancelAtPeriodEnd
      ? "Cancelamento agendado"
      : data?.status === "member"
        ? "Ativa"
        : data?.status === "canceled"
          ? "Encerrada"
          : "Sem assinatura ativa";
  const statusTone =
    data?.status === "member"
      ? "bg-[var(--sage-pale)] text-[var(--sage-deep)]"
      : "bg-[#f5e7df] text-[#9c583c]";

  return (
    <MemberShell
      eyebrow="Sua conta"
      title="Minha assinatura"
      description="Veja seu acesso atual ao Universo e gerencie a sua assinatura com clareza."
    >
      {subscription.isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <div className="h-96 animate-pulse rounded-3xl bg-[var(--linen)]" />
          <div className="h-72 animate-pulse rounded-3xl bg-[var(--linen)]" />
        </div>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_330px] lg:items-start">
          <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_12px_28px_rgba(8,31,77,.05)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage)]">
                  Plano atual
                </p>
                <h2 className="display-font mt-2 text-4xl font-semibold">{data.planName}</h2>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Gerenciado por {data.managedBy}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] ${statusTone}`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-5 rounded-2xl bg-[var(--linen)] p-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage)]">
                  Valor de referência
                </p>
                <p className="display-font mt-2 text-4xl font-semibold">
                  {money(data.priceCents)}
                  <span className="font-sans text-sm font-bold text-[var(--ink-soft)]">/mês</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)]">
                <CreditCard size={15} /> Cobrança segura pelo Stripe
              </div>
            </div>
            <div className="mt-8">
              <h3 className="display-font text-2xl font-semibold">O que seu acesso inclui</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Receitas completas",
                  "Academia Atípica",
                  "Comunidade de famílias",
                  "Guias complementares",
                  "Novos conteúdos",
                  "Progresso e anotações",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--ink-soft)]"
                  >
                    <Check size={16} className="text-[var(--sage)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {data.status === "member" && cancelAtPeriodEnd ? (
              <div className="mt-9 rounded-2xl border border-[#d8c38f] bg-[#fff9e8] p-5">
                <div className="flex items-start gap-3">
                  <CalendarClock size={19} className="mt-0.5 shrink-0 text-[#8b6b20]" />
                  <div>
                    <p className="text-sm font-extrabold text-[#6c5319]">Cancelamento agendado</p>
                    <p className="mt-2 text-xs leading-5 text-[#80682f]">
                      Seu acesso continua ativo até {dateLabel(currentPeriodEnd)}. Depois dessa
                      data, a assinatura não será renovada.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resume.mutate()}
                      disabled={resume.isPending}
                      className="pressable mt-4 rounded-xl border-[#d8c38f] bg-white text-xs font-extrabold text-[#6c5319]"
                    >
                      <RotateCcw size={14} className="mr-2" />
                      {resume.isPending ? "Reativando…" : "Desistir do cancelamento"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : data.status === "member" && data.canCancel ? (
              <div className="mt-9 border-t border-[var(--line)] pt-7">
                {!confirming ? (
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-extrabold">Quer cancelar o plano?</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                        O acesso continuará ativo até o fim do período já pago.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirming(true)}
                      className="pressable rounded-xl border-[#e4b9a4] bg-white text-xs font-extrabold text-[#9c583c] hover:bg-[#fdf3ee]"
                    >
                      Cancelar assinatura
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#e4b9a4] bg-[#fdf3ee] p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={19} className="mt-0.5 shrink-0 text-[#9c583c]" />
                      <div>
                        <p className="text-sm font-extrabold text-[#703c2b]">
                          Confirmar cancelamento?
                        </p>
                        <p className="mt-2 text-xs leading-5 text-[#8e5744]">
                          A renovação será desativada no Stripe. Você manterá o acesso até
                          {` ${dateLabel(currentPeriodEnd)}`}. Não haverá cancelamento imediato nem
                          reembolso automático.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() => cancel.mutate()}
                            disabled={cancel.isPending}
                            className="pressable rounded-xl bg-[#9c583c] text-xs font-extrabold text-white hover:bg-[#703c2b]"
                          >
                            {cancel.isPending ? "Cancelando..." : "Confirmar cancelamento"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirming(false)}
                            className="pressable rounded-xl border-[#e4b9a4] bg-white text-xs font-extrabold text-[#9c583c]"
                          >
                            Manter plano
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}{" "}
              </div>
            ) : null}
            {data.status === "canceled" ? (
              <div className="mt-9 rounded-2xl bg-[var(--linen)] p-5">
                <p className="text-sm font-extrabold">Seu plano está cancelado.</p>
                <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
                  Você continua podendo explorar os conteúdos públicos. Para voltar ao acesso
                  completo, conheça o plano novamente.
                </p>
                <Button
                  type="button"
                  onClick={() => setLocation("/checkout")}
                  className="pressable mt-4 rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white"
                >
                  Conhecer o plano <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            ) : null}
          </section>
          <aside className="rounded-3xl bg-[var(--sage-deep)] p-6 text-white sm:p-7">
            <Sparkles size={20} className="text-[#efd4a2]" />
            <h2 className="display-font mt-5 text-3xl font-semibold">Clareza para escolher.</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Você sempre poderá consultar seu status e entender quais possibilidades estão
              disponíveis para sua família.
            </p>
            <div className="mt-7 space-y-4 border-t border-white/10 pt-5">
              <p className="flex items-start gap-2 text-xs font-bold">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#efd4a2]" /> Cancelamento
                confirmado antes da alteração.
              </p>
              <p className="flex items-start gap-2 text-xs font-bold">
                <CreditCard size={15} className="mt-0.5 shrink-0 text-[#efd4a2]" /> A confirmação do
                estado vem diretamente dos webhooks do Stripe.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-white p-8 text-center">
          <h2 className="display-font text-3xl font-semibold">
            Não foi possível carregar sua assinatura.
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Atualize a página ou volte para sua área.
          </p>
        </div>
      )}
    </MemberShell>
  );
}
