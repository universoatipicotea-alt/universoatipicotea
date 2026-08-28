import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Bem-vindo de volta ao Universo Atípico.");
      setLocation("/comunidade");
    },
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Sua conta foi criada. Vamos preparar seu acesso.");
      setLocation("/checkout");
    },
  });
  const mutation = mode === "login" ? login : register;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "login") login.mutate({ email, password });
    else register.mutate({ name, email, password });
  };

  return (
    <main className="page-texture grid min-h-screen items-center bg-[var(--paper)] px-5 py-8 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-[var(--line)] bg-white shadow-[0_30px_90px_rgba(57,78,68,.14)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-[var(--ink)] lg:block">
          <img src="/manus-storage/universo-atipico-acesso-premium_73c1c0dd.webp" alt="Um espaço para você. Chegue como você está. Crie seu acesso para encontrar informação, companhia e recursos que respeitam o seu tempo. Seus dados ficam protegidos." className="absolute inset-0 h-full w-full object-cover object-center" />
        </section>
        <section className="p-7 sm:p-12 lg:p-16">
          <div className="mb-10 flex items-center justify-between"><Link href="/inicio" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)]"><ArrowLeft size={16} /> Voltar</Link><div className="lg:hidden"><Brand compact /></div></div>
          <div className="max-w-md">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">Acesso da comunidade</p>
            <h2 className="display-font mt-3 text-5xl font-semibold leading-[.95] tracking-[-.045em]">{mode === "login" ? "Que bom ter você aqui." : "Vamos criar seu espaço."}</h2>
            <p className="mt-5 text-sm leading-7 text-[var(--ink-soft)]">{mode === "login" ? "Entre com seu e-mail e senha para continuar sua jornada." : "Crie sua conta em menos de um minuto e ative sua assinatura."}</p>
            <form onSubmit={submit} className="mt-9 space-y-5">
              {mode === "register" ? <div className="space-y-2"><Label htmlFor="name">Como podemos chamar você?</Label><Input id="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Seu nome" required minLength={2} /></div> : null}
              <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@email.com" required /></div>
              <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="Pelo menos 8 caracteres" required minLength={mode === "register" ? 8 : 1} /></div>
              {mutation.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{mutation.error.message}</p> : null}
              <Button type="submit" disabled={mutation.isPending} className="pressable h-12 w-full rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]">{mutation.isPending ? <Loader2 className="mr-2 animate-spin" size={17} /> : <>{mode === "login" ? "Entrar na comunidade" : "Criar minha conta"}<ArrowRight className="ml-2" size={17} /></>}</Button>
            </form>
            <div className="mt-8 border-t border-[var(--line)] pt-6 text-center text-sm text-[var(--ink-soft)]"><span>{mode === "login" ? "Ainda não tem uma conta?" : "Já tem uma conta?"}</span><button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); login.reset(); register.reset(); }} className="ml-2 font-extrabold text-[var(--sage-deep)] hover:underline">{mode === "login" ? "Criar agora" : "Entrar"}</button></div>
          </div>
        </section>
      </div>
    </main>
  );
}
