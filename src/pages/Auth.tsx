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
  const { sources: loginVisual } = useVisualAsset("login", {
    desktopImageUrl: "/login-universo-atipico-desktop.webp",
    tabletImageUrl: "/login-universo-atipico-tablet.webp",
    mobileImageUrl: "/login-universo-atipico-mobile.webp",
    altText: "Universo Atípico — um espaço para você chegar como está",
  });
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
    <main className="page-texture relative flex min-h-[100dvh] items-center overflow-x-hidden bg-[var(--paper)] px-3 py-3 min-[360px]:px-4 min-[360px]:py-5 sm:px-8 sm:py-12">
      <div
        className="aurora-float pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[var(--sage-pale)]/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="aurora-float pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#efd4a2]/35 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid w-full min-w-0 max-w-7xl overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/90 shadow-[0_32px_90px_rgba(8,31,77,.14)] backdrop-blur sm:rounded-[2rem] xl:grid-cols-[minmax(0,1.45fr)_minmax(430px,.85fr)]">
        {/* Formulário primeiro no mobile */}
        <section className="order-1 min-w-0 p-4 min-[360px]:p-5 sm:p-10 xl:order-2 xl:p-12">
          <div className="mb-6 flex min-w-0 items-center justify-between gap-3 sm:mb-8">
            <Link
              href="/"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg pr-2 text-sm font-bold text-[var(--ink-soft)] transition hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
            >
              <ArrowLeft size={16} /> Voltar
            </Link>
            <div className="min-w-0 overflow-hidden rounded-xl bg-white px-2 py-1 shadow-sm [&_img]:!h-10 [&_img]:!max-w-[8.5rem] xl:hidden">
              <Brand compact priority />
            </div>
          </div>

          <div className="mx-auto w-full min-w-0 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--sage-deep)]">
              <Sparkles size={13} /> Área de membros
            </span>
            <h1 className="display-font mt-3 text-[2rem] font-semibold leading-[1.02] tracking-[-.04em] min-[360px]:text-4xl sm:text-5xl">
              Que bom ter você de volta.
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

        {/* A arte completa só é requisitada quando o painel desktop realmente é exibido. */}
        <section className="relative order-2 hidden min-h-[700px] overflow-hidden bg-[#082c62] xl:order-1 xl:block">
          <picture>
            <source media="(min-width: 1280px)" srcSet={loginVisual.desktop} />
            <img
              src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
              alt="Universo Atípico — um espaço para você chegar como está"
              className="absolute inset-0 h-full w-full object-contain object-center"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <div
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15"
            aria-hidden="true"
          />
        </section>
      </div>
    </main>
  );
}
