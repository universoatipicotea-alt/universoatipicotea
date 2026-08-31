import { useAuth } from "@/_core/hooks/useAuth";
import { MemberShell } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { call, trpc } from "@/lib/trpc";
import { ArrowRight, Check, Clock, RefreshCcw, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SessionInfo = {
  email: string | null;
  paid: boolean;
  active: boolean;
  state: "aprovado" | "pendente" | "recusado" | "cancelado" | "expirado";
  hasAccount: boolean;
};

const copy: Record<SessionInfo["state"], { title: string; text: string }> = {
  aprovado: {
    title: "Pagamento confirmado.",
    text: "Sua assinatura do Plano Universo está ativa. Falta só ativar sua conta.",
  },
  pendente: {
    title: "Estamos confirmando seu pagamento.",
    text: "Isso costuma levar poucos segundos. Deixe esta página aberta — atualizamos automaticamente.",
  },
  recusado: {
    title: "O pagamento não foi aprovado.",
    text: "Seu banco recusou a cobrança. Você pode tentar novamente com outro cartão.",
  },
  cancelado: {
    title: "O pagamento não foi concluído.",
    text: "A sessão de pagamento expirou ou foi cancelada. Você pode recomeçar quando quiser.",
  },
  expirado: {
    title: "Sua assinatura não está ativa.",
    text: "Não encontramos uma assinatura ativa para este pagamento.",
  },
};

export default function Obrigado() {
  const [, setLocation] = useLocation();
  const { user, refresh } = useAuth();
  const sessionId = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("session_id"),
    [],
  );

  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const sync = trpc.billing.sync.useMutation();

  const check = async () => {
    if (!sessionId) {
      setChecking(false);
      return;
    }
    try {
      const result = (await call("billing.session", { sessionId })) as SessionInfo;
      setInfo(result);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setChecking(false);
    }
  };

  // Primeira checagem + repetição enquanto o webhook não confirma.
  useEffect(() => {
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (info?.state !== "pendente") return;
    const timer = setTimeout(() => void check(), 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.state]);

  // Já logado: vincula a assinatura e segue para a área interna.
  useEffect(() => {
    if (!user || !info?.active) return;
    sync
      .mutateAsync({ sessionId })
      .then(async () => {
        await refresh();
        toast.success("Assinatura ativa. Bom te ver por aqui!");
        setLocation("/inicio");
      })
      .catch((error: Error) => toast.error(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, info?.active]);

  const activate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2) return toast.error("Informe seu nome.");
    if (password.length < 8) return toast.error("A senha precisa ter pelo menos 8 caracteres.");
    setCreating(true);
    try {
      await call("billing.activate", { sessionId, name: name.trim(), password });
      await call("auth.login", { email: info?.email, password });
      await refresh();
      toast.success("Conta ativada. Bem-vindo ao Universo Atípico!");
      setLocation("/inicio");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const state = info?.state ?? "pendente";
  const texts = copy[state];

  return (
    <MemberShell
      allowGuest
      eyebrow="Confirmação"
      title="Obrigado por assinar o Universo Atípico."
      description="Aqui você acompanha o status do pagamento e ativa seu acesso."
    >
      <section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(8,31,77,.08)] sm:p-10">
        <span
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
            state === "aprovado"
              ? "bg-[var(--sage-pale)] text-[var(--sage-deep)]"
              : state === "pendente"
                ? "bg-[var(--lavender)] text-[#5c5480]"
                : "bg-[#fdf0ea] text-[#a1543a]"
          }`}
        >
          {state === "aprovado" ? (
            <Check size={28} />
          ) : state === "pendente" ? (
            <Clock size={28} />
          ) : (
            <XCircle size={28} />
          )}
        </span>

        <h2 className="display-font mt-6 text-center text-4xl font-semibold leading-[.98] tracking-[-.04em] text-[var(--ink)]">
          {checking ? "Verificando seu pagamento…" : texts.title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-7 text-[var(--ink-soft)]">
          {checking ? "Um instante, estamos falando com o Stripe." : texts.text}
        </p>

        {!sessionId ? (
          <Button
            type="button"
            onClick={() => setLocation("/checkout")}
            className="pressable mt-8 h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
          >
            Ir para a assinatura <ArrowRight size={17} className="ml-2" />
          </Button>
        ) : null}

        {state === "pendente" && sessionId ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void check()}
            className="pressable mt-8 h-13 w-full rounded-xl text-sm font-extrabold"
          >
            <RefreshCcw size={16} className="mr-2" /> Verificar de novo
          </Button>
        ) : null}

        {["recusado", "cancelado", "expirado"].includes(state) ? (
          <Button
            type="button"
            onClick={() => setLocation("/checkout")}
            className="pressable mt-8 h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
          >
            Tentar o pagamento novamente <ArrowRight size={17} className="ml-2" />
          </Button>
        ) : null}

        {state === "aprovado" && !user ? (
          info?.hasAccount ? (
            <div className="mt-8 space-y-3 text-center">
              <p className="text-sm font-semibold text-[var(--ink-soft)]">
                Já existe uma conta com {info.email}. Entre para acessar.
              </p>
              <Button
                type="button"
                onClick={() => setLocation("/entrar")}
                className="pressable h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]"
              >
                Entrar <ArrowRight size={17} className="ml-2" />
              </Button>
            </div>
          ) : (
            <form onSubmit={activate} className="mt-8 space-y-4">
              <label className="block text-sm font-extrabold text-[var(--ink)]">
                E-mail do pagamento
                <input
                  readOnly
                  value={info?.email ?? ""}
                  className="mt-2 h-13 w-full cursor-not-allowed rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 text-sm font-medium text-[var(--ink-soft)]"
                />
              </label>
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
                Crie uma senha
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
                {creating ? (
                  "Ativando seu acesso…"
                ) : (
                  <>
                    Ativar conta e entrar <ArrowRight size={17} className="ml-2" />
                  </>
                )}
              </Button>
            </form>
          )
        ) : null}
      </section>
    </MemberShell>
  );
}
