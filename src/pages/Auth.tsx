import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVisualAsset } from "@/hooks/useVisualAsset";
import { call, trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

/** Página exclusiva de LOGIN. O cadastro só existe após a confirmação do pagamento. */
export default function Auth() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useVisualAsset("login", undefined, { enabled: false });
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async (
      authenticatedUser: { accessRole?: string; hasPaidAccess?: boolean } | null,
    ) => {
      await utils.auth.me.invalidate();
      toast.success("Bem-vindo de volta ao Universo Atípico.");
      setLocation(
        authenticatedUser?.accessRole === "admin_master"
          ? "/gestao"
          : authenticatedUser?.accessRole === "admin"
            ? "/gestao/academia"
            : authenticatedUser?.hasPaidAccess === false
              ? "/assinatura"
              : "/inicio",
      );
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ email: email.trim(), password });
  };

  const sendReset = async () => {
    if (!email.trim()) return toast.error("Informe o e-mail da sua conta para receber o link.");
    setSendingReset(true);
    try {
      await call("auth.resetPassword", { email: email.trim() });
      toast.success("Se existir uma conta com este e-mail, enviamos o link de recuperação.");
      setRecovering(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center overflow-x-hidden bg-[var(--academy-cream)] px-4 py-6 sm:px-8 sm:py-12">
      <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm">
        {/* Formulário primeiro no mobile */}
        <section className="min-w-0 p-5 sm:p-10">
          <div className="mb-6 flex min-w-0 items-center justify-between gap-3 sm:mb-8">
            <Link
              href="/"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg pr-2 text-sm font-bold text-[var(--ink-soft)] transition hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
            >
              <ArrowLeft size={16} /> Voltar
            </Link>
             <div className="min-w-0 overflow-hidden [&_img]:!h-10 [&_img]:!max-w-[8.5rem]">
              <Brand compact priority />
            </div>
          </div>

          <div className="mx-auto w-full min-w-0 max-w-md">
            <div className="mb-5 flex gap-2" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-[var(--blue)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--red)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--green)]" />
            </div>
            <h1 className="display-font text-[2rem] font-semibold leading-[1.05] min-[360px]:text-4xl sm:text-5xl">
              Bem-vindo de volta.
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Entre com seu e-mail e senha para acessar o Universo Atípico.
            </p>

            <form
              onSubmit={submit}
              className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
              aria-label="Entrar na conta"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-extrabold">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sage)]"
                  />
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    required
                    className="h-12 min-w-0 rounded-xl border-[var(--line)] bg-[var(--paper)] pl-11 transition focus:bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-extrabold">
                  Senha
                </Label>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sage)]"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha"
                    required
                    className="h-12 min-w-0 rounded-xl border-[var(--line)] bg-[var(--paper)] px-11 transition focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--ink-soft)] transition hover:bg-white hover:text-[var(--ink)]"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              {login.error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-[#fdf0ea] px-4 py-3 text-sm font-semibold text-[#a1543a]"
                >
                  {login.error.message}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={login.isPending}
                className="pressable min-h-12 w-full min-w-0 rounded-xl bg-[var(--sage-deep)] px-4 text-sm font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_12px_26px_rgba(55,95,74,.24)] hover:bg-[var(--ink)] min-[360px]:h-13"
                aria-busy={login.isPending}
              >
                {login.isPending ? (
                  <Loader2 className="mr-2 animate-spin" size={17} />
                ) : (
                  <>
                    Entrar <ArrowRight className="ml-2" size={17} />
                  </>
                )}
              </Button>
            </form>

            {recovering ? (
              <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--linen)] p-4">
                <p className="text-sm font-extrabold">Recuperar senha</p>
                <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                  Enviaremos um link para <strong>{email.trim() || "seu e-mail"}</strong> para você
                  criar uma nova senha.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={sendReset}
                    disabled={sendingReset}
                    className="pressable rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"
                  >
                    {sendingReset ? <Loader2 className="mr-2 animate-spin" size={14} /> : null}{" "}
                    Enviar link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRecovering(false)}
                    className="rounded-xl text-xs font-extrabold"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRecovering(true)}
                className="mt-5 text-sm font-extrabold text-[var(--sage-deep)] hover:underline"
              >
                Esqueci minha senha
              </button>
            )}

            <div className="mt-7 border-t border-[var(--line)] pt-5">
              <p className="text-sm text-[var(--ink-soft)]">
                Ainda não faz parte do Universo Atípico?
              </p>
              <Button
                asChild
                variant="outline"
                 className="mt-3 h-11 w-full rounded-xl border-[var(--line)] bg-[var(--card)] text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--paper)] sm:w-auto sm:px-5"
              >
                <Link href="/#assinatura">Conhecer a assinatura</Link>
              </Button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
