import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronRight, MessageCircleMore, Plus, Send, UsersRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useSearch } from "wouter";

const categories = ["Rotina", "Escola", "Comunicação", "Comportamento", "Autocuidado", "Outros"];

function initials(name?: string | null) {
  return (name || "UA").split(" ").map(value => value[0]).join("").slice(0, 2).toUpperCase();
}

function relativeDate(value: Date | string) {
  const date = new Date(value);
  const delta = Math.max(0, Date.now() - date.getTime());
  const hours = Math.floor(delta / 3_600_000);
  if (hours < 1) return "agora";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ontem" : `${days} dias`;
}

export default function Forum() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const topicId = useMemo(() => {
    const value = Number(new URLSearchParams(search).get("topic"));
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [search]);
  const topics = trpc.community.forum.list.useQuery();
  const detail = trpc.community.forum.detail.useQuery({ topicId: topicId ?? 1 }, { enabled: Boolean(topicId) });
  const utils = trpc.useUtils();
  const createTopic = trpc.community.forum.createTopic.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.community.forum.list.invalidate(), utils.community.memberDashboard.invalidate()]);
      toast.success("Sua conversa foi publicada.");
    },
    onError: error => toast.error(error.message),
  });
  const addComment = trpc.community.forum.addComment.useMutation({
    onSuccess: async () => {
      if (topicId) await utils.community.forum.detail.invalidate({ topicId });
      await Promise.all([utils.community.forum.list.invalidate(), utils.community.memberDashboard.invalidate()]);
      toast.success("Sua resposta foi enviada.");
    },
    onError: error => toast.error(error.message),
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", body: "", category: categories[0] });
  const [comment, setComment] = useState("");

  const submitTopic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createTopic.mutateAsync(newTopic);
    setNewTopic({ title: "", body: "", category: categories[0] });
    setDialogOpen(false);
  };
  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topicId) return;
    await addComment.mutateAsync({ topicId, body: comment });
    setComment("");
  };

  if (topicId && detail.isLoading) {
    return <MemberShell eyebrow="Conversas" title="Fórum da comunidade" description="Abrindo a conversa selecionada."><div className="space-y-5"><div className="h-64 animate-pulse rounded-[2rem] bg-[var(--linen)]" /><div className="h-36 animate-pulse rounded-3xl bg-[var(--linen)]" /></div></MemberShell>;
  }

  if (topicId && (detail.isError || !detail.data)) {
    return <MemberShell eyebrow="Conversas" title="Fórum da comunidade" description="Perguntas, trocas e experiências compartilhadas com cuidado."><button type="button" onClick={() => setLocation("/forum")} className="mb-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--sage-deep)] hover:underline"><ArrowLeft size={16} />Voltar às conversas</button><ContentEmpty icon={MessageCircleMore} title={detail.isError ? "Não foi possível abrir essa conversa" : "Essa conversa não foi encontrada"} text={detail.isError ? "Tente atualizar a página. Se o problema continuar, volte à lista de conversas." : "Ela pode ter sido removida pela moderação ou o endereço pode estar incorreto."} /></MemberShell>;
  }

  if (topicId && detail.data) {
    const { topic, comments } = detail.data;
    return <MemberShell eyebrow="Conversas" title="Fórum da comunidade" description="Perguntas, trocas e experiências compartilhadas com cuidado.">
      <button type="button" onClick={() => setLocation("/forum")} className="mb-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--sage-deep)] hover:underline"><ArrowLeft size={16} />Voltar às conversas</button>
      <article className="rounded-[2rem] border border-[var(--line)] bg-white p-6 sm:p-9"><span className="rounded-full bg-[var(--sage-pale)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage-deep)]">{topic.category}</span><h2 className="display-font mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.035em]">{topic.title}</h2><div className="mt-6 flex items-center gap-3 text-xs text-[var(--ink-soft)]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--lavender)] font-extrabold text-[var(--sage-deep)]">{initials(topic.authorDisplayName || topic.authorName)}</span><span>Por <strong className="text-[var(--ink)]">{topic.authorDisplayName || topic.authorName || "Membro da comunidade"}</strong> · {relativeDate(topic.createdAt)}</span></div><p className="mt-7 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-soft)]">{topic.body}</p></article>
      <section className="mt-12"><SectionHeading label={`${comments.length} ${comments.length === 1 ? "resposta" : "respostas"}`} title="A conversa continua" />{comments.length ? <div className="space-y-3">{comments.map(reply => <article key={reply.id} className="soft-card rounded-2xl p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--sage-pale)] text-[11px] font-extrabold text-[var(--sage-deep)]">{initials(reply.authorDisplayName || reply.authorName)}</span><div><p className="text-sm font-extrabold">{reply.authorDisplayName || reply.authorName || "Membro da comunidade"}</p><p className="text-xs text-[var(--ink-soft)]">{relativeDate(reply.createdAt)}</p></div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-soft)]">{reply.body}</p></article>)}</div> : <ContentEmpty icon={MessageCircleMore} title="Seja a primeira pessoa a responder" text="Uma mensagem cuidadosa pode abrir espaço para uma troca importante." />}
        <form onSubmit={submitComment} className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-5"><Label htmlFor="comment" className="text-sm font-extrabold">Responder à conversa</Label><Textarea id="comment" value={comment} onChange={event => setComment(event.target.value)} minLength={2} maxLength={5000} placeholder="Escreva com respeito e cuidado..." className="mt-3 min-h-28 rounded-xl border-[var(--line)] bg-[var(--paper)]" required /><div className="mt-4 flex justify-end"><Button disabled={addComment.isPending} className="pressable rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]"><Send size={16} className="mr-2" />{addComment.isPending ? "Enviando..." : "Publicar resposta"}</Button></div></form>
      </section>
    </MemberShell>;
  }

  return <MemberShell eyebrow="Conversas" title="Fórum da comunidade" description="Um espaço para perguntas reais, trocas de experiência e apoio entre famílias.">
    <div className="mb-9 flex flex-col justify-between gap-4 rounded-3xl bg-[var(--sage-deep)] p-6 text-white sm:flex-row sm:items-center"><div><UsersRound size={20} className="text-[#efd4a2]" /><h2 className="display-font mt-4 text-3xl font-semibold leading-none">Toda pergunta merece cuidado.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Compartilhe uma situação, uma dúvida ou uma experiência que possa abrir caminhos.</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="pressable shrink-0 rounded-xl bg-white font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]"><Plus size={16} className="mr-2" />Abrir conversa</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-[var(--line)] bg-[var(--paper)] sm:max-w-xl"><DialogHeader><DialogTitle className="display-font text-3xl font-semibold">Abrir uma conversa</DialogTitle><DialogDescription className="leading-6">Escreva de forma respeitosa e evite expor informações sensíveis de terceiros.</DialogDescription></DialogHeader><form onSubmit={submitTopic} className="mt-2 space-y-5"><div><Label htmlFor="topic-title" className="text-sm font-extrabold">Título</Label><Input id="topic-title" value={newTopic.title} onChange={event => setNewTopic(current => ({ ...current, title: event.target.value }))} minLength={6} maxLength={180} placeholder="Qual é sua pergunta ou assunto?" className="mt-2 h-11 rounded-xl border-[var(--line)] bg-white" required /></div><div><Label htmlFor="topic-category" className="text-sm font-extrabold">Tema</Label><select id="topic-category" value={newTopic.category} onChange={event => setNewTopic(current => ({ ...current, category: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm">{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div><div><Label htmlFor="topic-body" className="text-sm font-extrabold">Mensagem</Label><Textarea id="topic-body" value={newTopic.body} onChange={event => setNewTopic(current => ({ ...current, body: event.target.value }))} minLength={20} maxLength={8000} placeholder="Conte um pouco do contexto e o que você gostaria de trocar com a comunidade." className="mt-2 min-h-40 rounded-xl border-[var(--line)] bg-white" required /></div><div className="flex justify-end"><Button disabled={createTopic.isPending} className="pressable rounded-xl bg-[var(--sage-deep)] font-extrabold text-white hover:bg-[var(--ink)]">{createTopic.isPending ? "Publicando..." : "Publicar conversa"}</Button></div></form></DialogContent></Dialog></div>
    <section>{topics.isLoading ? <div className="space-y-3"><div className="h-24 animate-pulse rounded-2xl bg-[var(--linen)]" /><div className="h-24 animate-pulse rounded-2xl bg-[var(--linen)]" /></div> : topics.data?.length ? <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white">{topics.data.map(topic => <Link key={topic.id} href={`/forum?topic=${topic.id}`} className="nav-link group flex items-center gap-4 border-b border-[var(--line)] p-5 last:border-0 hover:bg-[var(--paper)] sm:p-6"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--sage-pale)] text-xs font-extrabold text-[var(--sage-deep)]">{initials(topic.authorDisplayName || topic.authorName)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage)]">{topic.category}</span><span className="text-xs text-[var(--ink-soft)]">· {relativeDate(topic.updatedAt)}</span></div><h3 className="mt-1 truncate text-sm font-extrabold">{topic.title}</h3><p className="mt-1 truncate text-xs text-[var(--ink-soft)]">Por {topic.authorDisplayName || topic.authorName || "Membro da comunidade"}</p></div><div className="flex shrink-0 items-center gap-4 text-xs font-extrabold text-[var(--ink-soft)]"><span className="hidden items-center gap-1 sm:flex"><MessageCircleMore size={15} />{topic.commentCount}</span><ChevronRight size={18} className="transition-transform group-hover:translate-x-1" /></div></Link>)}</div> : <ContentEmpty icon={MessageCircleMore} title="As primeiras conversas começam aqui" text="Abra um tópico para compartilhar uma pergunta ou uma experiência com a comunidade." />}</section>
  </MemberShell>;
}
