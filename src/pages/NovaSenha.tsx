import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { call } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/** Define uma nova senha a partir do link de recuperação enviado por e-mail. */
export default function NovaSenha() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) return toast.error("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não são iguais.");
    setSaving(true);
    try {
      await call("auth.updatePassword", { password });
      toast.success("Senha atualizada. Faça login para continuar.");
      setLocation("/entrar");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page-texture grid min-h-screen place-items-center bg-[var(--paper)] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(8,31,77,.08)] sm:p-10">
        <Brand compact />
        <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sage)]">Recuperação de acesso</p>
        <h1 className="display-font mt-3 text-3xl font-semibold leading-[1.04] tracking-[-.04em]">Crie uma nova senha.</h1>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-extrabold">Nova senha</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 rounded-xl border-[var(--line)]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-extrabold">Confirmar senha</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="h-11 rounded-xl border-[var(--line)]" />
          </div>
          <Button type="submit" disabled={saving} className="pressable h-12 w-full rounded-xl bg-[var(--sage-deep)] text-sm font-extrabold text-white hover:bg-[var(--ink)]">
            {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : null} Salvar nova senha
          </Button>
        </form>
      </div>
    </main>
  );
}
