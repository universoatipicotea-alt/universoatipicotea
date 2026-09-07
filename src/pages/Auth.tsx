import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { call, trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
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
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Bem-vindo de volta ao Universo Atípico.");
      setLocation("/inicio");
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
    <main className="page-texture relative flex min-h-screen items-center overflow-hidden bg-[var(--paper)] px-4 py-5 sm:px-8 sm:py-12">
      <div
        className="aurora-float pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[var(--sage-pale)]/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="aurora-float pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#efd4a2]/35 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_32px_90px_rgba(8,31,77,.14)] backdrop-blur lg:grid-cols-[1.05fr_.95fr]">
        {/* Formulário primeiro no mobile */}
        <section className="order-1 p-5 sm:p-10 lg:order-2 lg:p-14">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <ArrowLeft size={16} /> Voltar
            </Link>
            <div className="rounded-xl bg-white px-2 py-1 shadow-sm lg:hidden">
              <Brand compact />
            </div>
          </div>

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage-deep)]">
              <Sparkles size={13} /> Área de membros
            </span>
            <h1 className="display-font mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-5xl">
              Que bom ter você de volta.
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Entre com seu e-mail e senha para acessar o Universo Atípico.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5" aria-label="Entrar na conta">
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
                    className="h-12 rounded-xl border-[var(--line)] bg-[var(--paper)] pl-11 transition focus:bg-white"
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
                    className="h-12 rounded-xl border-[var(--line)] bg-[var(--paper)] px-11 transition focus:bg-white"
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
                className="pressable h-13 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_12px_26px_rgba(55,95,74,.24)] hover:bg-[var(--ink)]"
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

            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--linen)] p-4">
              <p className="text-sm text-[var(--ink-soft)]">
                Ainda não faz parte do Universo Atípico?
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-3 h-11 w-full rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--paper)] sm:w-auto sm:px-5"
              >
                <Link href="/#assinatura">Conhecer a assinatura</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Painel editorial: some no mobile para priorizar o formulário */}
        <section className="relative order-2 hidden min-h-[560px] overflow-hidden bg-[var(--ink)] lg:order-1 lg:block">
          <img
            src="/manus-storage/universo-atipico-acesso-premium_73c1c0dd.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/75 to-[var(--ink)]/10" />
          <div className="hero-tech-grid absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-end p-12">
            <div className="mb-auto w-fit rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl">
              <Brand compact />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#efd4a2]">
              Universo Atípico
            </p>
            <h2 className="display-font mt-4 max-w-sm text-4xl font-semibold leading-[1.02] text-white">
              Seu Universo continua aqui.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">
              Entre para continuar seus conteúdos, acessar sua biblioteca e participar da
              comunidade.
            </p>
            <p className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-white/70">
              <ShieldCheck size={15} /> Seus dados ficam protegidos.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
