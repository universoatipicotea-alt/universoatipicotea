import { MemberShell, SectionHeading } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Camera, ImageUp, Loader2, LogOut, Save } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

async function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler essa imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function avatarInitials(name?: string) {
  return (name || "UA").split(" ").map(value => value[0]).join("").slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { logout } = useAuth();
  const profileQuery = trpc.community.profile.me.useQuery();
  const utils = trpc.useUtils();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const updateProfile = trpc.community.profile.update.useMutation({
    onSuccess: async () => { await Promise.all([utils.community.profile.me.invalidate(), utils.community.memberDashboard.invalidate()]); toast.success("Seu perfil foi atualizado."); },
    onError: error => toast.error(error.message),
  });
  const updatePreferences = trpc.community.preferences.update.useMutation({
    onSuccess: () => { utils.community.profile.me.invalidate(); toast.success("Preferências atualizadas."); },
    onError: error => toast.error(error.message),
  });
  const uploadAvatar = trpc.community.files.uploadAvatar.useMutation({
    onSuccess: result => { setAvatarKey(result.key); toast.success("Imagem carregada. Salve o perfil para confirmar a alteração."); },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (profileQuery.data?.profile) {
      setDisplayName(profileQuery.data.profile.displayName);
      setBio(profileQuery.data.profile.bio || "");
      setAvatarKey(profileQuery.data.profile.avatarKey);
    }
  }, [profileQuery.data]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error("Envie uma imagem JPG, PNG ou WEBP."); return; }
    if (file.size > 4 * 1024 * 1024) { toast.error("A imagem deve ter até 4 MB."); return; }
    const dataUrl = await readAsDataUrl(file);
    await uploadAvatar.mutateAsync({ fileName: file.name, dataUrl });
  };
  const handleSave = async () => updateProfile.mutateAsync({ displayName, bio: bio || null, avatarKey });
  const preferences = profileQuery.data?.preferences;
  const profile = profileQuery.data?.profile;
  const previewUrl = uploadAvatar.data?.url || profile?.avatarUrl;
  const togglePreference = (key: "notifyGuides" | "notifyReplies" | "notifyCommunity", value: boolean) => {
    if (!preferences) return;
    updatePreferences.mutate({ ...preferences, [key]: value });
  };

  if (profileQuery.isError) {
    return <MemberShell eyebrow="Meu perfil" title="Seu espaço, do seu jeito." description="Não foi possível carregar suas informações agora."><div className="rounded-3xl border border-dashed border-[var(--line)] bg-white/60 px-6 py-12 text-center"><h2 className="display-font text-3xl font-semibold">Seu perfil não abriu desta vez.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--ink-soft)]">Atualize a página ou tente novamente em alguns minutos. Nenhuma alteração foi feita.</p></div></MemberShell>;
  }

  if (profileQuery.isLoading) {
    return <MemberShell eyebrow="Meu perfil" title="Seu espaço, do seu jeito." description="Estamos organizando suas preferências."><div className="grid gap-6 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-[var(--linen)]" /><div className="h-80 animate-pulse rounded-3xl bg-[var(--linen)]" /></div></MemberShell>;
  }

  return <MemberShell eyebrow="Meu perfil" title="Seu espaço, do seu jeito." description="Atualize como você quer ser reconhecida na comunidade e escolha quais novidades deseja acompanhar.">
    <section className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><div className="soft-card rounded-3xl p-6"><SectionHeading label="Imagem" title="Foto de perfil" /><div className="flex flex-col items-center text-center"><button type="button" onClick={() => fileInput.current?.click()} className="group relative grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-[var(--sage-pale)] text-2xl font-extrabold text-[var(--sage-deep)]"><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleUpload} />{previewUrl ? <img src={previewUrl} alt="Prévia do perfil" className="h-full w-full object-cover" /> : avatarInitials(displayName)}<span className="absolute inset-0 grid place-items-center bg-[var(--ink)]/55 text-white opacity-0 transition-opacity group-hover:opacity-100"><Camera size={21} /></span></button><p className="mt-5 text-sm font-extrabold">Uma imagem para a comunidade reconhecer você.</p><p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">JPG, PNG ou WEBP, com até 4 MB.</p><Button variant="outline" onClick={() => fileInput.current?.click()} disabled={uploadAvatar.isPending} className="pressable mt-5 rounded-xl border-[var(--line)] bg-white text-xs font-extrabold text-[var(--sage-deep)]">{uploadAvatar.isPending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <ImageUp size={15} className="mr-2" />}{uploadAvatar.isPending ? "Enviando..." : "Escolher imagem"}</Button></div></div>
      <div className="soft-card rounded-3xl p-6 sm:p-8"><SectionHeading label="Informações" title="Como a comunidade vê você" /><div className="space-y-5"><div><Label htmlFor="profile-name" className="text-sm font-extrabold">Nome de exibição</Label><Input id="profile-name" value={displayName} onChange={event => setDisplayName(event.target.value)} minLength={2} maxLength={120} className="mt-2 h-11 rounded-xl border-[var(--line)] bg-white" /></div><div><Label htmlFor="profile-bio" className="text-sm font-extrabold">Sobre você <span className="font-medium text-[var(--ink-soft)]">(opcional)</span></Label><Textarea id="profile-bio" value={bio} onChange={event => setBio(event.target.value)} maxLength={500} placeholder="Conte um pouco sobre o que você deseja encontrar por aqui." className="mt-2 min-h-32 rounded-xl border-[var(--line)] bg-white" /><p className="mt-2 text-right text-xs text-[var(--ink-soft)]">{bio.length}/500</p></div><div className="flex justify-end"><Button onClick={handleSave} disabled={updateProfile.isPending || displayName.trim().length < 2} className="pressable rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]"><Save size={16} className="mr-2" />{updateProfile.isPending ? "Salvando..." : "Salvar perfil"}</Button></div></div></div>
    </section>
    <section className="mt-12 max-w-3xl"><SectionHeading label="Preferências" title="O que você quer acompanhar" /><div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white">{[{ key: "notifyGuides" as const, title: "Novos guias", text: "Receber novidades quando um material for publicado." }, { key: "notifyReplies" as const, title: "Respostas nas conversas", text: "Ser avisada quando houver movimento nos tópicos em que você participa." }, { key: "notifyCommunity" as const, title: "Novidades da comunidade", text: "Acompanhar comunicações ocasionais sobre o espaço." }].map(item => <div key={item.key} className="flex items-center justify-between gap-5 border-b border-[var(--line)] p-5 last:border-0"><div><h3 className="text-sm font-extrabold">{item.title}</h3><p className="mt-1 max-w-md text-xs leading-5 text-[var(--ink-soft)]">{item.text}</p></div><Switch checked={preferences?.[item.key] ?? false} onCheckedChange={checked => togglePreference(item.key, checked)} disabled={!preferences || updatePreferences.isPending} /></div>)}</div>
    </section>
    <section className="mt-12 max-w-3xl rounded-3xl border border-[#e4c8bd] bg-[#fff8f5] p-6"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9c583c]">Sessão</p><h2 className="display-font mt-2 text-3xl font-semibold">Sair desta conta</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">Você poderá entrar novamente quando quiser. Seus conteúdos, preferências e acesso continuarão associados à sua conta.</p><Button variant="outline" onClick={() => logout()} className="pressable mt-5 rounded-xl border-[#d9b4a6] bg-white font-extrabold text-[#8d4e35] hover:bg-[#fff0eb]"><LogOut size={16} className="mr-2" />Sair da minha conta</Button></section>
  </MemberShell>;
}
