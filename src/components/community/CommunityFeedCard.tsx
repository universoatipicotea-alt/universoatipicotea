import { HeartHandshake, MessageCircleMore, Pin } from "lucide-react";
import { CommunityAvatar } from "./CommunityAvatar";
import { CommunityImageGallery } from "./CommunityImageGallery";
import { authorLabel, relativeCommunityDate } from "./community-utils";
import type { CommunityTopic } from "./types";

type CommunityFeedCardProps = {
  topic: CommunityTopic;
  onOpen: () => void;
  onReact: () => void;
  reactionPending?: boolean;
};

export function CommunityFeedCard({
  topic,
  onOpen,
  onReact,
  reactionPending = false,
}: CommunityFeedCardProps) {
  const author = authorLabel(topic);
  const activity = topic.lastActivityAt || topic.updatedAt || topic.createdAt;
  const reactionClass = topic.viewerReacted
    ? "bg-[var(--sage-deep)] text-white"
    : "bg-[var(--sage-pale)] text-[var(--sage-deep)] hover:-translate-y-0.5";

  return (
    <article className="interactive-card min-w-0 overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_16px_45px_-36px_rgba(8,31,77,.55)] sm:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <CommunityAvatar name={author} image={topic.authorAvatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="max-w-full truncate text-sm font-extrabold text-[var(--ink)]">{author}</p>
            <span className="text-xs text-[var(--ink-soft)]">
              <span aria-hidden="true">· </span>
              <time dateTime={String(activity)}>{relativeCommunityDate(activity)}</time>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {topic.isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4dc] px-2.5 py-1 text-[10px] font-extrabold text-[#7a5619]">
                <Pin size={11} aria-hidden="true" /> Fixado
              </span>
            ) : null}
            <span className="rounded-full bg-[var(--sage-pale)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--sage-deep)]">
              {topic.category}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 block w-full min-w-0 rounded-lg text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sage)]/30"
        aria-label={`Abrir conversa: ${topic.title}`}
      >
        <h2 className="break-words text-xl font-extrabold leading-7 text-[var(--ink)] sm:text-2xl">
          {topic.title}
        </h2>
        <p className="mt-2 line-clamp-3 break-words whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">
          {topic.body}
        </p>
      </button>

      <CommunityImageGallery attachments={topic.attachments ?? []} title={topic.title} compact />

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
        <button
          type="button"
          onClick={onReact}
          disabled={reactionPending}
          aria-pressed={Boolean(topic.viewerReacted)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sage)]/35 disabled:opacity-60 ${reactionClass}`}
        >
          <HeartHandshake size={16} aria-hidden="true" />
          Acolher{topic.reactionCount ? ` · ${topic.reactionCount}` : ""}
        </button>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Abrir conversa e responder. ${topic.commentCount ?? 0} respostas atuais.`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--ink)] bg-white px-4 text-xs font-extrabold text-[var(--ink)] transition hover:-translate-y-0.5 hover:bg-[var(--ink)] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sage)]/30"
        >
          <MessageCircleMore size={16} aria-hidden="true" />
          Responder
          <span aria-hidden="true">· {topic.commentCount ?? 0}</span>
        </button>
      </div>
    </article>
  );
}
