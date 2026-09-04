-- Evolução aditiva da comunidade: respostas encadeadas, reações e denúncias.
-- Conversas e comentários existentes permanecem válidos como itens de primeiro nível.

ALTER TABLE public.ua_forum_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id BIGINT
    REFERENCES public.ua_forum_comments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

ALTER TABLE public.ua_forum_topics
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS ua_forum_comments_parent_idx
  ON public.ua_forum_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS ua_forum_comments_topic_created_idx
  ON public.ua_forum_comments(topic_id, created_at);
CREATE INDEX IF NOT EXISTS ua_forum_topics_activity_idx
  ON public.ua_forum_topics(is_pinned DESC, last_activity_at DESC);

CREATE TABLE IF NOT EXISTS public.ua_forum_reactions (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES public.ua_forum_comments(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'support' CHECK (reaction IN ('support','helpful','heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS public.ua_forum_reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  topic_id BIGINT REFERENCES public.ua_forum_topics(id) ON DELETE CASCADE,
  comment_id BIGINT REFERENCES public.ua_forum_comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed','actioned')),
  reviewed_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((topic_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS ua_forum_reports_open_topic_unique
  ON public.ua_forum_reports(reporter_id, topic_id) WHERE status = 'open' AND topic_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ua_forum_reports_open_comment_unique
  ON public.ua_forum_reports(reporter_id, comment_id) WHERE status = 'open' AND comment_id IS NOT NULL;

ALTER TABLE public.ua_forum_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ua_forum_reports ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ua_forum_reactions, public.ua_forum_reports TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_forum_reactions_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_forum_reports_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.ua_sync_forum_topic_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_topic_id BIGINT := COALESCE(NEW.topic_id, OLD.topic_id);
BEGIN
  UPDATE public.ua_forum_topics
  SET
    comment_count = (
      SELECT count(*)::integer
      FROM public.ua_forum_comments
      WHERE topic_id = affected_topic_id AND status = 'visible'
    ),
    last_activity_at = COALESCE(
      (SELECT max(created_at) FROM public.ua_forum_comments WHERE topic_id = affected_topic_id AND status = 'visible'),
      created_at
    ),
    updated_at = now()
  WHERE id = affected_topic_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS ua_forum_comment_activity_trigger ON public.ua_forum_comments;
CREATE TRIGGER ua_forum_comment_activity_trigger
AFTER INSERT OR UPDATE OF status OR DELETE ON public.ua_forum_comments
FOR EACH ROW EXECUTE FUNCTION public.ua_sync_forum_topic_activity();

REVOKE ALL ON FUNCTION public.ua_sync_forum_topic_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ua_sync_forum_topic_activity() TO service_role;
