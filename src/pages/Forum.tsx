import { ContentEmpty, MemberShell } from "@/components/MemberShell";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import { CommunityComposer } from "@/components/community/CommunityComposer";
import { CommunityFeedCard } from "@/components/community/CommunityFeedCard";
import { ConfirmCommunityAction } from "@/components/community/ConfirmCommunityAction";
import {
  authorLabel,
  mergeById,
  normalizeCommentPage,
  normalizeFeedPage,
  normalizeTopicDetail,
  relativeCommunityDate,
} from "@/components/community/community-utils";
import type { CommunityComment, CommunityTopic } from "@/components/community/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { COMMUNITY_CATEGORIES } from "@shared/community";
import {
  ArrowLeft,
  Flag,
  HeartHandshake,
  Loader2,
  MessageCircleMore,
  Plus,
  Search,
  Send,
  Trash2,
  UsersRound,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";

type SortOption = "recentes" | "respondidas" | "sem-resposta";
type ReportTarget = { topicId?: number; commentId?: number };
const categories = ["Todos", ...COMMUNITY_CATEGORIES] as const;

function LoadingCards() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando conteúdo">
      {[1, 2, 3].map((id) => (
        <div key={id} className="h-40 animate-pulse rounded-3xl bg-[var(--linen)]" />
      ))}
    </div>
  );
}

export default function Forum() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const topicId = useMemo(() => {
    const value = Number(new URLSearchParams(search).get("topic"));
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }, [search]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState<SortOption>("recentes");
  const [feedCursor, setFeedCursor] = useState<string | null>(null);
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [commentCursor, setCommentCursor] = useState<string | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [reporting, setReporting] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [deleteTopicOpen, setDeleteTopicOpen] = useState(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    setFeedCursor(null);
    setTopics([]);
  }, [debouncedQuery, category, sort]);
  useEffect(() => {
    setCommentCursor(null);
    setComments([]);
    setReplyTo(null);
  }, [topicId]);

  const feed = trpc.community.forum.feed.useQuery({
    query: debouncedQuery || undefined,
    category: category === "Todos" ? undefined : category,
    sort,
    cursor: feedCursor || undefined,
    limit: 12,
  });
  const feedPage = useMemo(() => normalizeFeedPage(feed.data), [feed.data]);
  useEffect(() => {
    if (feed.data)
      setTopics((current) => (feedCursor ? mergeById(current, feedPage.items) : feedPage.items));
  }, [feed.data, feedCursor, feedPage]);
  const detailQuery = trpc.community.forum.detail.useQuery(
    { topicId: topicId ?? 1 },
    { enabled: Boolean(topicId) },
  );
  const detail = useMemo(() => normalizeTopicDetail(detailQuery.data), [detailQuery.data]);
  const commentQuery = trpc.community.forum.comments.list.useQuery(
    { topicId: topicId ?? 1, cursor: commentCursor || undefined, limit: 20 },
    { enabled: Boolean(topicId) },
  );
  const commentPage = useMemo(() => normalizeCommentPage(commentQuery.data), [commentQuery.data]);
  useEffect(() => {
    if (commentQuery.data)
      setComments((current) =>
        commentCursor ? mergeById(current, commentPage.items) : commentPage.items,
      );
  }, [commentCursor, commentPage, commentQuery.data]);

  const refresh = async () =>
    Promise.all([
      utils.community.forum.feed.invalidate(),
      utils.community.forum.detail.invalidate(),
      utils.community.forum.comments.list.invalidate(),
      utils.community.memberDashboard.invalidate(),
    ]);
  const topicReaction = trpc.community.forum.toggleTopicReaction.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });
  const addComment = trpc.community.forum.addComment.useMutation({
    onSuccess: async () => {
      setReplyBody("");
      setReplyTo(null);
      setCommentCursor(null);
      await refresh();
      toast.success("Resposta publicada.");
    },
    onError: (error) => toast.error(error.message),
  });
  const commentReaction = trpc.community.forum.toggleReaction.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });
  const deleteTopic = trpc.community.forum.deleteTopic.useMutation({
    onSuccess: async () => {
      setDeleteTopicOpen(false);
      setLocation("/comunidade");
      await refresh();
      toast.success("Conversa removida.");
    },
    onError: (error) => toast.error(error.message),
  });
  const report = trpc.community.forum.report.useMutation({
    onSuccess: () => {
      setReporting(null);
      setReportReason("");
      toast.success("Denúncia enviada para a moderação.");
    },
    onError: (error) => toast.error(error.message),
  });
  const submitReply = async (event: FormEvent<HTMLFormElement>, parentCommentId: number | null) => {
    event.preventDefault();
    if (topicId)
      await addComment.mutateAsync({
        topicId,
        parentCommentId,
        body: replyBody,
        clientRequestId: crypto.randomUUID(),
      });
  };

  if (topicId)
    return (
      <MemberShell
        eyebrow="Comunidade"
        title="Conversa"
        description="Trocas cuidadosas entre membros do Universo Atípico."
      >
        <Button
          variant="ghost"
          className="mb-5 min-h-11"
          onClick={() => setLocation("/comunidade")}
        >
          <ArrowLeft className="mr-2" size={17} />
          Voltar para a comunidade
        </Button>
        {detailQuery.isLoading ? (
          <LoadingCards />
        ) : detailQuery.isError || !detail ? (
          <ContentEmpty
            title="Conversa indisponível"
            text="Ela pode ter sido removida ou estar temporariamente indisponível."
          />
        ) : (
          <div className="space-y-5">
            <article className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <CommunityAvatar
                  name={authorLabel(detail.topic)}
                  image={detail.topic.authorAvatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{authorLabel(detail.topic)}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {relativeCommunityDate(detail.topic.createdAt)}
                    {detail.topic.editedAt ? " · editado" : ""}
                  </p>
                </div>
              </div>
              <h1 className="mt-5 break-words text-2xl font-extrabold sm:text-3xl">
                {detail.topic.title}
              </h1>
              <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-[var(--ink-soft)]">
                {detail.topic.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => topicReaction.mutate({ topicId })}>
                  <HeartHandshake className="mr-2" size={17} />
                  Acolher · {detail.topic.reactionCount ?? 0}
                </Button>
                <Button variant="ghost" onClick={() => setReporting({ topicId })}>
                  <Flag className="mr-2" size={16} />
                  Denunciar conteúdo
                </Button>
                {detail.topic.viewerIsAuthor ? (
                  <Button
                    variant="ghost"
                    className="text-red-700"
                    onClick={() => setDeleteTopicOpen(true)}
                  >
                    <Trash2 className="mr-2" size={16} />
                    Remover
                  </Button>
                ) : null}
              </div>
            </article>
            <section className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-7">
              <h2 className="text-2xl font-extrabold">Participe da conversa</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Responda com respeito e evite compartilhar dados pessoais.
              </p>
              {!replyTo ? (
                <form onSubmit={(event) => submitReply(event, null)} className="mt-5 space-y-3">
                  <Label htmlFor="topic-reply" className="sr-only">
                    Responder à conversa
                  </Label>
                  <Textarea
                    id="topic-reply"
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    minLength={2}
                    maxLength={5000}
                    required
                    placeholder="Escreva sua resposta…"
                    className="min-h-28"
                  />
                  <Button type="submit" disabled={addComment.isPending}>
                    <Send className="mr-2" size={16} />
                    {addComment.isPending ? "Publicando…" : "Publicar resposta"}
                  </Button>
                </form>
              ) : null}
              <div className="mt-7 space-y-3">
                {comments.map((comment) => (
                  <article
                    key={comment.id}
                    className={`rounded-2xl border border-[var(--line)] p-4 ${comment.parentCommentId ? "ml-5 bg-[var(--linen)]/40 sm:ml-10" : "bg-white"}`}
                  >
                    <div className="flex gap-3">
                      <CommunityAvatar
                        name={authorLabel(comment)}
                        image={comment.authorAvatarUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold">{authorLabel(comment)}</p>
                        <p className="text-xs text-[var(--ink-soft)]">
                          {relativeCommunityDate(comment.createdAt)}
                          {comment.editedAt ? " · editado" : ""}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                      {comment.body}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          commentReaction.mutate({ commentId: comment.id, reaction: "support" })
                        }
                      >
                        Acolher · {comment.reactionCount ?? 0}
                      </Button>
                      {!comment.parentCommentId ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Responder a esta mensagem"
                          onClick={() => {
                            setReplyBody("");
                            setReplyTo(comment.id);
                          }}
                        >
                          Responder
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReporting({ commentId: comment.id })}
                      >
                        Denunciar
                      </Button>
                    </div>
                    {replyTo === comment.id ? (
                      <form
                        onSubmit={(event) => submitReply(event, comment.id)}
                        className="mt-4 space-y-3 rounded-2xl bg-[var(--linen)] p-4"
                      >
                        <Label htmlFor={`comment-reply-${comment.id}`} className="font-extrabold">
                          Responder para {authorLabel(comment)}
                        </Label>
                        <Textarea
                          id={`comment-reply-${comment.id}`}
                          autoFocus
                          value={replyBody}
                          onChange={(event) => setReplyBody(event.target.value)}
                          minLength={2}
                          maxLength={5000}
                          required
                          placeholder="Escreva sua resposta…"
                          className="min-h-24 bg-white"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" size="sm" disabled={addComment.isPending}>
                            <Send className="mr-2" size={15} />
                            {addComment.isPending ? "Publicando…" : "Publicar resposta"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReplyBody("");
                              setReplyTo(null);
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </article>
                ))}
                {commentQuery.isLoading ? <LoadingCards /> : null}
                {!commentQuery.isLoading && comments.length === 0 ? (
                  <ContentEmpty
                    title="Ainda não há respostas"
                    text="Você pode iniciar esta troca com uma resposta acolhedora."
                  />
                ) : null}
                {commentPage.nextCursor ? (
                  <Button
                    variant="outline"
                    onClick={() => setCommentCursor(commentPage.nextCursor)}
                  >
                    Carregar mais respostas
                  </Button>
                ) : null}
              </div>
            </section>
          </div>
        )}
        <ConfirmCommunityAction
          open={deleteTopicOpen}
          onOpenChange={setDeleteTopicOpen}
          title="Remover conversa?"
          description="A conversa deixará de aparecer para os membros."
          confirmLabel="Remover conversa"
          pending={deleteTopic.isPending}
          onConfirm={() => deleteTopic.mutate({ topicId })}
        />
        <ReportDialog
          target={reporting}
          reason={reportReason}
          setReason={setReportReason}
          pending={report.isPending}
          onClose={() => setReporting(null)}
          onSubmit={() => reporting && report.mutate({ ...reporting, reason: reportReason })}
        />
      </MemberShell>
    );

  return (
    <MemberShell
      eyebrow="Comunidade"
      title="Conversas que acolhem"
      description="Pergunte, compartilhe experiências e encontre outras famílias."
    >
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-[var(--ink)] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <UsersRound size={18} />
            Comunidade Universo Atípico
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
            Um espaço moderado. Preserve sua privacidade e a das crianças.
          </p>
        </div>
        <Button
          className="min-h-12 shrink-0 border border-[#f4c96b] bg-[#f4c96b] px-6 font-extrabold !text-[#071f4d] shadow-lg hover:bg-[#f8d88f] hover:!text-[#071f4d] focus-visible:ring-[#f4c96b]"
          onClick={() => setComposerOpen(true)}
        >
          <Plus className="mr-2" size={18} />
          Nova conversa
        </Button>
      </div>
      <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Label className="relative">
          <span className="sr-only">Buscar conversas</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={17} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar conversas"
            className="h-12 pl-10"
          />
        </Label>
        <select
          aria-label="Filtrar por tema"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-12 rounded-xl border px-3"
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Ordenar conversas"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOption)}
          className="h-12 rounded-xl border px-3"
        >
          <option value="recentes">Mais recentes</option>
          <option value="respondidas">Mais respondidas</option>
          <option value="sem-resposta">Sem resposta</option>
        </select>
      </div>
      <div className="mt-6 space-y-4">
        {topics.map((topic) => (
          <CommunityFeedCard
            key={topic.id}
            topic={topic}
            onReact={() => topicReaction.mutate({ topicId: topic.id })}
            reactionPending={topicReaction.isPending}
          />
        ))}
        {feed.isLoading ? <LoadingCards /> : null}
        {feed.isError ? (
          <div className="space-y-3 text-center">
            <ContentEmpty title="Não foi possível carregar" text="Tente novamente em instantes." />
            <Button onClick={() => feed.refetch()}>Tentar novamente</Button>
          </div>
        ) : null}
        {!feed.isLoading && !feed.isError && topics.length === 0 ? (
          <div className="space-y-3 text-center">
            <ContentEmpty
              title="Nenhuma conversa encontrada"
              text="Ajuste os filtros ou abra a primeira conversa deste tema."
            />
            <Button onClick={() => setComposerOpen(true)}>Nova conversa</Button>
          </div>
        ) : null}
        {feedPage.nextCursor ? (
          <Button
            variant="outline"
            className="min-h-12 w-full"
            onClick={() => setFeedCursor(feedPage.nextCursor)}
          >
            <MessageCircleMore className="mr-2" size={17} />
            Carregar mais conversas
          </Button>
        ) : null}
      </div>
      <CommunityComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onCreated={async (id) => {
          await refresh();
          window.location.assign(`/comunidade?topic=${encodeURIComponent(String(id))}`);
        }}
      />
    </MemberShell>
  );
}

function ReportDialog({
  target,
  reason,
  setReason,
  pending,
  onClose,
  onSubmit,
}: {
  target: ReportTarget | null;
  reason: string;
  setReason: (value: string) => void;
  pending: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar conteúdo</DialogTitle>
          <DialogDescription>
            A moderação analisará o relato. Explique o motivo sem incluir dados pessoais.
          </DialogDescription>
        </DialogHeader>
        <Label htmlFor="report-reason">Motivo</Label>
        <Textarea
          id="report-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          minLength={5}
          maxLength={1000}
          className="min-h-28"
        />
        <Button disabled={pending || reason.trim().length < 5} onClick={onSubmit}>
          {pending ? (
            <Loader2 className="mr-2 animate-spin" size={16} />
          ) : (
            <Flag className="mr-2" size={16} />
          )}
          Enviar denúncia
        </Button>
      </DialogContent>
    </Dialog>
  );
}
