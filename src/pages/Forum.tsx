import { useAuth } from "@/_core/hooks/useAuth";
import { ContentEmpty, MemberShell, SectionHeading } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ChevronRight,
  Flag,
  HeartHandshake,
  MessageCircleMore,
  Pencil,
  Pin,
  Plus,
  Search,
  Send,
  Trash2,
  UsersRound,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";

const categories = [
  "Todos",
  "Rotina",
  "Escola",
  "Comunicação",
  "Comportamento",
  "Autocuidado",
  "Outros",
];

type ForumComment = {
  id: number;
  parentCommentId?: number | null;
  authorId: number;
  authorName?: string | null;
  authorDisplayName?: string | null;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  reactionCount?: number;
  viewerReactions?: string[];
};

function initials(name?: string | null) {
  return (name || "UA")
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeDate(value: Date | string) {
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ontem" : `${days} dias`;
}

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  return image ? (
    <img src={image} alt="" className="h-10 w-10 rounded-full object-cover" />
  ) : (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--sage-pale)] text-xs font-extrabold text-[var(--sage-deep)]">
      {initials(name)}
    </span>
  );
}

export default function Forum() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const topicId = useMemo(() => {
    const value = Number(new URLSearchParams(searchParams).get("topic"));
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [searchParams]);
  const topics = trpc.community.forum.list.useQuery();
  const detail = trpc.community.forum.detail.useQuery(
    { topicId: topicId ?? 1 },
    { enabled: Boolean(topicId) },
  );
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", body: "", category: "Rotina" });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("recentes");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editing, setEditing] = useState<{ id: number; body: string } | null>(null);
  const [reporting, setReporting] = useState<{ topicId?: number; commentId?: number } | null>(null);
  const [reportReason, setReportReason] = useState("");

  const refresh = async () => {
    if (topicId) await utils.community.forum.detail.invalidate({ topicId });
    await Promise.all([
      utils.community.forum.list.invalidate(),
      utils.community.memberDashboard.invalidate(),
    ]);
  };
  const createTopic = trpc.community.forum.createTopic.useMutation({
    onSuccess: async () => {
      await refresh();
      setDialogOpen(false);
      setNewTopic({ title: "", body: "", category: "Rotina" });
      toast.success("Conversa publicada.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const addComment = trpc.community.forum.addComment.useMutation({
    onSuccess: async () => {
      await refresh();
      setReplyBody("");
      setReplyTo(null);
      toast.success("Resposta publicada.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const toggleReaction = trpc.community.forum.toggleReaction.useMutation({
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const updateComment = trpc.community.forum.updateComment.useMutation({
    onSuccess: async () => {
      await refresh();
      setEditing(null);
      toast.success("Resposta atualizada.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteComment = trpc.community.forum.deleteComment.useMutation({
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const report = trpc.community.forum.report.useMutation({
    onSuccess: () => {
      setReporting(null);
      setReportReason("");
      toast.success("Denúncia enviada para a moderação.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredTopics = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    const rows = (topics.data || []).filter((topic: any) => {
      const matchesCategory = category === "Todos" || topic.category === category;
      const matchesTerm =
        !term || `${topic.title} ${topic.body}`.toLocaleLowerCase("pt-BR").includes(term);
      return matchesCategory && matchesTerm;
    });
    return [...rows].sort((a: any, b: any) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sort === "respondidas") return Number(b.commentCount || 0) - Number(a.commentCount || 0);
      if (sort === "sem-resposta") return Number(a.commentCount || 0) - Number(b.commentCount || 0);
      return (
        new Date(b.lastActivityAt || b.updatedAt).getTime() -
        new Date(a.lastActivityAt || a.updatedAt).getTime()
      );
    });
  }, [topics.data, category, query, sort]);

  const submitTopic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createTopic.mutateAsync(newTopic);
  };
  const submitReply = async (event: FormEvent<HTMLFormElement>, parentCommentId?: number) => {
    event.preventDefault();
    if (!topicId) return;
    await addComment.mutateAsync({
      topicId,
      parentCommentId: parentCommentId || null,
      body: replyBody,
    });
  };

  if (topicId && detail.isLoading)
    return (
      <MemberShell
        eyebrow="Comunidade"
        title="Abrindo conversa…"
        description="Carregando respostas e participantes."
      >
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-3xl bg-[var(--linen)]" />
          <div className="h-36 animate-pulse rounded-3xl bg-[var(--linen)]" />
        </div>
      </MemberShell>
    );

  if (topicId && (detail.isError || !detail.data))
    return (
      <MemberShell
        eyebrow="Comunidade"
        title="Conversa indisponível"
        description="Ela pode ter sido removida ou estar temporariamente indisponível."
      >
        <Button variant="outline" onClick={() => setLocation("/comunidade")}>
          <ArrowLeft size={16} className="mr-2" />
          Voltar à comunidade
        </Button>
      </MemberShell>
    );

  if (topicId && detail.data) {
    const { topic, comments } = detail.data as { topic: any; comments: ForumComment[] };
    const roots = comments.filter((comment) => !comment.parentCommentId);
    const children = (parentId: number) =>
      comments.filter((comment) => comment.parentCommentId === parentId);
    const replyForm = (parentCommentId?: number) => (
      <form
        onSubmit={(event) => submitReply(event, parentCommentId)}
        className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
      >
        <Label htmlFor={`reply-${parentCommentId || "topic"}`} className="text-xs font-extrabold">
          {parentCommentId ? "Responder a esta mensagem" : "Responder à conversa"}
        </Label>
        <Textarea
          id={`reply-${parentCommentId || "topic"}`}
          value={replyBody}
          onChange={(event) => setReplyBody(event.target.value)}
          minLength={2}
          maxLength={5000}
          placeholder="Escreva com respeito e cuidado…"
          className="mt-2 min-h-28 rounded-xl border-[var(--line)] bg-white"
          required
        />
        <div className="mt-3 flex justify-end gap-2">
          {parentCommentId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setReplyTo(null);
                setReplyBody("");
              }}
            >
              Cancelar
            </Button>
          ) : null}
          <Button disabled={addComment.isPending}>
            <Send size={15} className="mr-2" />
            Publicar resposta
          </Button>
        </div>
      </form>
    );
    const commentCard = (comment: ForumComment, nested = false) => {
      const author = comment.authorDisplayName || comment.authorName || "Membro da comunidade";
      const liked = comment.viewerReactions?.includes("support");
      return (
        <article
          key={comment.id}
          className={`rounded-2xl border border-[var(--line)] bg-white p-5 ${nested ? "ml-6 border-l-4 border-l-[var(--sage-pale)] sm:ml-14" : ""}`}
        >
          <div className="flex items-start gap-3">
            <Avatar name={author} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold">{author}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {relativeDate(comment.createdAt)}
                    {comment.editedAt ? " · editado" : ""}
                  </p>
                </div>
              </div>
              {editing?.id === comment.id ? (
                <div className="mt-4">
                  <Textarea
                    value={editing.body}
                    onChange={(event) => setEditing({ id: comment.id, body: event.target.value })}
                    className="min-h-28"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditing(null)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() =>
                        updateComment.mutate({ commentId: comment.id, body: editing.body })
                      }
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-soft)]">
                  {comment.body}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    toggleReaction.mutate({ commentId: comment.id, reaction: "support" })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${liked ? "bg-[var(--sage-deep)] text-white" : "bg-[var(--sage-pale)] text-[var(--sage-deep)]"}`}
                >
                  <HeartHandshake size={14} />
                  Acolher {comment.reactionCount ? `· ${comment.reactionCount}` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(comment.parentCommentId || comment.id);
                    setReplyBody("");
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]"
                >
                  Responder
                </button>
                {comment.authorId === user?.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing({ id: comment.id, body: comment.body })}
                      className="rounded-full p-2 text-[var(--ink-soft)] hover:bg-[var(--linen)]"
                      aria-label="Editar resposta"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteComment.mutate({ commentId: comment.id })}
                      className="rounded-full p-2 text-[var(--ink-soft)] hover:bg-red-50 hover:text-red-700"
                      aria-label="Remover resposta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReporting({ commentId: comment.id })}
                    className="rounded-full p-2 text-[var(--ink-soft)] hover:bg-[var(--linen)]"
                    aria-label="Denunciar resposta"
                  >
                    <Flag size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          {replyTo === (comment.parentCommentId || comment.id) && !nested
            ? replyForm(comment.id)
            : null}
        </article>
      );
    };

    return (
      <MemberShell
        eyebrow="Comunidade"
        title="Uma conversa de cada vez."
        description="Pergunte, responda e compartilhe experiências com cuidado."
      >
        <button
          type="button"
          onClick={() => setLocation("/comunidade")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--sage-deep)]"
        >
          <ArrowLeft size={16} />
          Todas as conversas
        </button>
        <article className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_50px_rgba(8,31,77,.06)] sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage-deep)]">
              {topic.category}
            </span>
            {topic.isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4dc] px-3 py-1 text-[10px] font-extrabold text-[#8b631d]">
                <Pin size={11} />
                Fixado
              </span>
            ) : null}
          </div>
          <h2 className="display-font mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] sm:text-5xl">
            {topic.title}
          </h2>
          <div className="mt-6 flex items-center gap-3">
            <Avatar
              name={topic.authorDisplayName || topic.authorName}
              image={topic.authorAvatarUrl}
            />
            <div>
              <p className="text-sm font-extrabold">
                {topic.authorDisplayName || topic.authorName || "Membro da comunidade"}
              </p>
              <p className="text-xs text-[var(--ink-soft)]">{relativeDate(topic.createdAt)}</p>
            </div>
          </div>
          <p className="mt-7 max-w-4xl whitespace-pre-wrap text-base leading-8 text-[var(--ink-soft)]">
            {topic.body}
          </p>
          <button
            type="button"
            onClick={() => setReporting({ topicId: topic.id })}
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            <Flag size={13} />
            Denunciar conversa
          </button>
        </article>
        <section className="mt-10">
          <SectionHeading
            label={`${comments.length} ${comments.length === 1 ? "resposta" : "respostas"}`}
            title="A conversa continua"
          />
          {roots.length ? (
            <div className="space-y-4">
              {roots.map((root) => (
                <div key={root.id} className="space-y-3">
                  {commentCard(root)}
                  {children(root.id).map((child) => commentCard(child, true))}
                </div>
              ))}
            </div>
          ) : (
            <ContentEmpty
              icon={MessageCircleMore}
              title="Seja a primeira pessoa a responder"
              text="Uma resposta cuidadosa pode abrir um caminho importante."
            />
          )}
          {replyTo === null ? replyForm() : null}
        </section>
        <Dialog open={Boolean(reporting)} onOpenChange={(open) => !open && setReporting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Denunciar conteúdo</DialogTitle>
              <DialogDescription>
                A moderação analisará a situação sem identificar você publicamente.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder="Conte brevemente o que aconteceu"
              maxLength={1000}
            />
            <Button
              disabled={report.isPending || reportReason.trim().length < 3}
              onClick={() => report.mutate({ ...reporting, reason: reportReason })}
            >
              Enviar para moderação
            </Button>
          </DialogContent>
        </Dialog>
      </MemberShell>
    );
  }

  return (
    <MemberShell
      eyebrow="Comunidade"
      title="Conversas que acolhem e aproximam."
      description="Um espaço seguro para perguntar, compartilhar experiências e encontrar outras famílias."
    >
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-[var(--ink)] p-6 text-white sm:p-8">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <UsersRound size={22} className="text-[#efd4a2]" />
            <h2 className="display-font mt-5 max-w-2xl text-3xl font-semibold sm:text-4xl">
              Toda experiência pode ajudar alguém.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Abra uma conversa ou participe de uma troca que já começou.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 bg-[#efd4a2] text-[var(--ink)] hover:bg-white">
                <Plus size={16} className="mr-2" />
                Nova conversa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="display-font text-3xl">Abrir uma conversa</DialogTitle>
                <DialogDescription>
                  Evite expor dados pessoais de crianças ou de terceiros.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submitTopic} className="space-y-5">
                <div>
                  <Label htmlFor="topic-title">Título</Label>
                  <Input
                    id="topic-title"
                    value={newTopic.title}
                    onChange={(event) =>
                      setNewTopic((current) => ({ ...current, title: event.target.value }))
                    }
                    minLength={6}
                    maxLength={180}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic-category">Tema</Label>
                  <select
                    id="topic-category"
                    value={newTopic.category}
                    onChange={(event) =>
                      setNewTopic((current) => ({ ...current, category: event.target.value }))
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                  >
                    {categories.slice(1).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="topic-body">Mensagem</Label>
                  <Textarea
                    id="topic-body"
                    value={newTopic.body}
                    onChange={(event) =>
                      setNewTopic((current) => ({ ...current, body: event.target.value }))
                    }
                    minLength={20}
                    maxLength={8000}
                    className="min-h-40"
                    required
                  />
                </div>
                <Button className="w-full" disabled={createTopic.isPending}>
                  {createTopic.isPending ? "Publicando…" : "Publicar conversa"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>
      <ToolbarCommunity
        query={query}
        setQuery={setQuery}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
      />
      <section className="mt-7">
        {topics.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-2xl bg-[var(--linen)]" />
            ))}
          </div>
        ) : filteredTopics.length ? (
          <div className="space-y-3">
            {filteredTopics.map((topic: any) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setLocation(`/comunidade?topic=${topic.id}`)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--sage)] hover:shadow-[0_14px_34px_rgba(8,31,77,.07)] sm:p-6"
              >
                <Avatar
                  name={topic.authorDisplayName || topic.authorName}
                  image={topic.authorAvatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {topic.isPinned ? <Pin size={13} className="text-[#a87522]" /> : null}
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sage)]">
                      {topic.category}
                    </span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      · {relativeDate(topic.lastActivityAt || topic.updatedAt)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-[var(--ink)] sm:text-lg">
                    {topic.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--ink-soft)]">{topic.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs font-extrabold text-[var(--ink-soft)]">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircleMore size={16} />
                    {topic.commentCount}
                  </span>
                  <ChevronRight size={18} className="transition group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <ContentEmpty
            icon={Search}
            title="Nenhuma conversa encontrada"
            text="Tente outro termo ou abra uma nova conversa."
          />
        )}
      </section>
    </MemberShell>
  );
}

function ToolbarCommunity({
  query,
  setQuery,
  category,
  setCategory,
  sort,
  setSort,
}: {
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 md:grid-cols-[1fr_auto_auto]">
      <label className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar conversas"
          className="pl-9"
        />
      </label>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold"
      >
        {categories.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value)}
        className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold"
      >
        <option value="recentes">Mais recentes</option>
        <option value="respondidas">Mais respondidas</option>
        <option value="sem-resposta">Sem resposta</option>
      </select>
    </div>
  );
}
