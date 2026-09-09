-- Comunidade de alta performance — evolução estritamente aditiva.
-- Não remove conversas, comentários, reações, denúncias ou arquivos existentes.

ALTER TABLE public.ua_forum_topics
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS reaction_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_request_id UUID,
  ADD COLUMN IF NOT EXISTS search_document TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese'::regconfig, coalesce(body, '')), 'B')
  ) STORED;

ALTER TABLE public.ua_forum_comments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS reaction_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_request_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS ua_forum_topics_author_request_unique
  ON public.ua_forum_topics(author_id, client_request_id)
  WHERE client_request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ua_forum_comments_author_request_unique
  ON public.ua_forum_comments(author_id, client_request_id)
  WHERE client_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ua_forum_topics_feed_cursor_idx
  ON public.ua_forum_topics(status, is_pinned DESC, last_activity_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ua_forum_topics_answered_cursor_idx
  ON public.ua_forum_topics(status, is_pinned DESC, comment_count DESC, last_activity_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ua_forum_topics_category_feed_idx
  ON public.ua_forum_topics(category, status, is_pinned DESC, last_activity_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ua_forum_topics_search_idx
  ON public.ua_forum_topics USING GIN(search_document);
CREATE INDEX IF NOT EXISTS ua_forum_comments_root_cursor_idx
  ON public.ua_forum_comments(topic_id, status, parent_comment_id, created_at, id);
CREATE INDEX IF NOT EXISTS ua_forum_reports_status_created_idx
  ON public.ua_forum_reports(status, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS public.ua_forum_topic_reactions (
  id BIGSERIAL PRIMARY KEY,
  topic_id BIGINT NOT NULL REFERENCES public.ua_forum_topics(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'support' CHECK (reaction IN ('support', 'heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS ua_forum_topic_reactions_topic_idx
  ON public.ua_forum_topic_reactions(topic_id);

CREATE TABLE IF NOT EXISTS public.ua_forum_attachments (
  id BIGSERIAL PRIMARY KEY,
  uploader_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  topic_id BIGINT REFERENCES public.ua_forum_topics(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'community-media',
  storage_key TEXT NOT NULL UNIQUE,
  original_name TEXT,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 5242880),
  width INTEGER CHECK (width IS NULL OR (width > 0 AND width <= 12000)),
  height INTEGER CHECK (height IS NULL OR (height > 0 AND height <= 12000)),
  alt_text TEXT CHECK (alt_text IS NULL OR char_length(alt_text) <= 240),
  position SMALLINT NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 3),
  status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'attached', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attached_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ua_forum_attachments_topic_position_unique
  ON public.ua_forum_attachments(topic_id, position)
  WHERE topic_id IS NOT NULL AND status = 'attached';
CREATE INDEX IF NOT EXISTS ua_forum_attachments_topic_idx
  ON public.ua_forum_attachments(topic_id, status, position);
CREATE INDEX IF NOT EXISTS ua_forum_attachments_staged_cleanup_idx
  ON public.ua_forum_attachments(uploader_id, status, created_at);

CREATE TABLE IF NOT EXISTS public.ua_forum_rate_limits (
  user_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action ~ '^[a-z][a-z0-9_.-]{1,63}$'),
  bucket_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, action)
);

CREATE INDEX IF NOT EXISTS ua_forum_rate_limits_cleanup_idx
  ON public.ua_forum_rate_limits(updated_at);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.ua_forum_topic_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ua_forum_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ua_forum_rate_limits ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.ua_forum_topic_reactions, public.ua_forum_attachments, public.ua_forum_rate_limits
  TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_forum_topic_reactions_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_forum_attachments_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.ua_consume_forum_rate_limit(
  p_user_id BIGINT,
  p_action TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_action !~ '^[a-z][a-z0-9_.-]{1,63}$'
     OR p_limit < 1 OR p_limit > 10000
     OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate limit parameters';
  END IF;

  INSERT INTO public.ua_forum_rate_limits AS limits (
    user_id,
    action,
    bucket_started_at,
    request_count,
    updated_at
  )
  VALUES (p_user_id, p_action, now(), 1, now())
  ON CONFLICT (user_id, action) DO UPDATE
  SET bucket_started_at = CASE
        WHEN limits.bucket_started_at <= now() - make_interval(secs => p_window_seconds)
          THEN now()
        ELSE limits.bucket_started_at
      END,
      request_count = CASE
        WHEN limits.bucket_started_at <= now() - make_interval(secs => p_window_seconds)
          THEN 1
        ELSE limits.request_count + 1
      END,
      updated_at = now()
  RETURNING request_count INTO current_count;

  RETURN current_count <= p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.ua_toggle_forum_topic_reaction(
  p_topic_id BIGINT,
  p_user_id BIGINT,
  p_reaction TEXT DEFAULT 'support'
)
RETURNS TABLE(active BOOLEAN, reaction_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id BIGINT;
BEGIN
  IF p_reaction NOT IN ('support', 'heart') THEN
    RAISE EXCEPTION 'invalid reaction';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.ua_forum_topics
    WHERE id = p_topic_id AND status = 'visible' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'topic unavailable';
  END IF;

  SELECT id INTO existing_id
  FROM public.ua_forum_topic_reactions
  WHERE topic_id = p_topic_id AND user_id = p_user_id AND reaction = p_reaction
  FOR UPDATE;

  IF existing_id IS NULL THEN
    INSERT INTO public.ua_forum_topic_reactions(topic_id, user_id, reaction)
    VALUES (p_topic_id, p_user_id, p_reaction)
    ON CONFLICT (topic_id, user_id, reaction) DO NOTHING;
  ELSE
    DELETE FROM public.ua_forum_topic_reactions WHERE id = existing_id;
  END IF;

  SELECT count(*)::INTEGER INTO reaction_count
  FROM public.ua_forum_topic_reactions WHERE topic_id = p_topic_id;
  active := existing_id IS NULL AND EXISTS (
    SELECT 1 FROM public.ua_forum_topic_reactions
    WHERE topic_id = p_topic_id AND user_id = p_user_id AND reaction = p_reaction
  );
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.ua_toggle_forum_comment_reaction(
  p_comment_id BIGINT,
  p_user_id BIGINT,
  p_reaction TEXT DEFAULT 'support'
)
RETURNS TABLE(active BOOLEAN, reaction_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id BIGINT;
BEGIN
  IF p_reaction NOT IN ('support', 'helpful', 'heart') THEN
    RAISE EXCEPTION 'invalid reaction';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.ua_forum_comments
    WHERE id = p_comment_id AND status = 'visible' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'comment unavailable';
  END IF;

  SELECT id INTO existing_id
  FROM public.ua_forum_reactions
  WHERE comment_id = p_comment_id AND user_id = p_user_id AND reaction = p_reaction
  FOR UPDATE;

  IF existing_id IS NULL THEN
    INSERT INTO public.ua_forum_reactions(comment_id, user_id, reaction)
    VALUES (p_comment_id, p_user_id, p_reaction)
    ON CONFLICT (comment_id, user_id, reaction) DO NOTHING;
  ELSE
    DELETE FROM public.ua_forum_reactions WHERE id = existing_id;
  END IF;

  SELECT count(*)::INTEGER INTO reaction_count
  FROM public.ua_forum_reactions WHERE comment_id = p_comment_id;
  active := existing_id IS NULL AND EXISTS (
    SELECT 1 FROM public.ua_forum_reactions
    WHERE comment_id = p_comment_id AND user_id = p_user_id AND reaction = p_reaction
  );
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.ua_create_forum_topic(
  p_author_id BIGINT,
  p_title TEXT,
  p_body TEXT,
  p_category TEXT,
  p_client_request_id UUID,
  p_attachment_ids BIGINT[] DEFAULT ARRAY[]::BIGINT[]
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_topic_id BIGINT;
  attachment_count INTEGER;
BEGIN
  SELECT id INTO created_topic_id
  FROM public.ua_forum_topics
  WHERE author_id = p_author_id AND client_request_id = p_client_request_id;
  IF created_topic_id IS NOT NULL THEN
    RETURN created_topic_id;
  END IF;

  IF cardinality(p_attachment_ids) > 4 THEN
    RAISE EXCEPTION 'too many attachments';
  END IF;
  SELECT count(*)::INTEGER INTO attachment_count
  FROM public.ua_forum_attachments
  WHERE id = ANY(p_attachment_ids)
    AND uploader_id = p_author_id
    AND status = 'staged'
    AND topic_id IS NULL;
  IF attachment_count <> cardinality(p_attachment_ids) THEN
    RAISE EXCEPTION 'invalid attachment selection';
  END IF;

  INSERT INTO public.ua_forum_topics(
    author_id,
    title,
    body,
    category,
    client_request_id,
    status,
    last_activity_at
  )
  VALUES (
    p_author_id,
    p_title,
    p_body,
    p_category,
    p_client_request_id,
    'visible',
    now()
  )
  RETURNING id INTO created_topic_id;

  UPDATE public.ua_forum_attachments
  SET topic_id = created_topic_id,
      status = 'attached',
      position = array_position(p_attachment_ids, id) - 1,
      attached_at = now()
  WHERE id = ANY(p_attachment_ids)
    AND uploader_id = p_author_id
    AND status = 'staged';

  RETURN created_topic_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT id INTO created_topic_id
    FROM public.ua_forum_topics
    WHERE author_id = p_author_id AND client_request_id = p_client_request_id;
    IF created_topic_id IS NULL THEN RAISE; END IF;
    RETURN created_topic_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ua_list_forum_topics(
  p_query TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'recentes',
  p_cursor_pinned BOOLEAN DEFAULT NULL,
  p_cursor_number BIGINT DEFAULT NULL,
  p_cursor_time TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 13,
  p_include_hidden BOOLEAN DEFAULT false
)
RETURNS SETOF public.ua_forum_topics
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT topic.*
  FROM public.ua_forum_topics AS topic
  WHERE (p_include_hidden OR (topic.status = 'visible' AND topic.deleted_at IS NULL))
    AND (NULLIF(trim(p_category), '') IS NULL OR topic.category = p_category)
    AND (
      p_sort <> 'sem-resposta'
      OR topic.comment_count = 0
    )
    AND (
      NULLIF(trim(p_query), '') IS NULL
      OR topic.search_document @@ websearch_to_tsquery('portuguese'::regconfig, trim(p_query))
    )
    AND (
      p_cursor_id IS NULL
      OR (topic.is_pinned = false AND p_cursor_pinned = true)
      OR (
        topic.is_pinned = p_cursor_pinned
        AND (
          (
            p_sort = 'respondidas'
            AND (
              topic.comment_count < p_cursor_number
              OR (
                topic.comment_count = p_cursor_number
                AND topic.last_activity_at < p_cursor_time
              )
              OR (
                topic.comment_count = p_cursor_number
                AND topic.last_activity_at = p_cursor_time
                AND topic.id < p_cursor_id
              )
            )
          )
          OR (
            p_sort <> 'respondidas'
            AND (
              topic.last_activity_at < p_cursor_time
              OR (topic.last_activity_at = p_cursor_time AND topic.id < p_cursor_id)
            )
          )
        )
      )
    )
  ORDER BY
    topic.is_pinned DESC,
    CASE WHEN p_sort = 'respondidas' THEN topic.comment_count END DESC,
    topic.last_activity_at DESC,
    topic.id DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 31);
$$;

CREATE OR REPLACE FUNCTION public.ua_list_forum_root_comments(
  p_topic_id BIGINT,
  p_cursor_time TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 16,
  p_include_hidden BOOLEAN DEFAULT false
)
RETURNS SETOF public.ua_forum_comments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT comment.*
  FROM public.ua_forum_comments AS comment
  WHERE comment.topic_id = p_topic_id
    AND comment.parent_comment_id IS NULL
    AND (p_include_hidden OR comment.status = 'visible')
    AND (
      p_cursor_id IS NULL
      OR comment.created_at > p_cursor_time
      OR (comment.created_at = p_cursor_time AND comment.id > p_cursor_id)
    )
  ORDER BY comment.created_at ASC, comment.id ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 31);
$$;

CREATE OR REPLACE FUNCTION public.ua_enforce_forum_reply_depth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_topic_id BIGINT;
  grandparent_id BIGINT;
  parent_status TEXT;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN RETURN NEW; END IF;
  SELECT topic_id, parent_comment_id, status
    INTO parent_topic_id, grandparent_id, parent_status
  FROM public.ua_forum_comments
  WHERE id = NEW.parent_comment_id;
  IF parent_topic_id IS NULL OR parent_topic_id <> NEW.topic_id
     OR grandparent_id IS NOT NULL OR parent_status <> 'visible' THEN
    RAISE EXCEPTION 'invalid parent comment';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ua_forum_reply_depth_trigger ON public.ua_forum_comments;
CREATE TRIGGER ua_forum_reply_depth_trigger
BEFORE INSERT OR UPDATE OF parent_comment_id, topic_id ON public.ua_forum_comments
FOR EACH ROW EXECUTE FUNCTION public.ua_enforce_forum_reply_depth();

CREATE OR REPLACE FUNCTION public.ua_sync_forum_reaction_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_topic_id BIGINT;
  affected_comment_id BIGINT;
BEGIN
  IF TG_TABLE_NAME = 'ua_forum_topic_reactions' THEN
    affected_topic_id := COALESCE(NEW.topic_id, OLD.topic_id);
    UPDATE public.ua_forum_topics
    SET reaction_count = (
      SELECT count(*)::INTEGER FROM public.ua_forum_topic_reactions
      WHERE topic_id = affected_topic_id
    )
    WHERE id = affected_topic_id;
  ELSE
    affected_comment_id := COALESCE(NEW.comment_id, OLD.comment_id);
    UPDATE public.ua_forum_comments
    SET reaction_count = (
      SELECT count(*)::INTEGER FROM public.ua_forum_reactions
      WHERE comment_id = affected_comment_id
    )
    WHERE id = affected_comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS ua_forum_topic_reaction_counter_trigger
  ON public.ua_forum_topic_reactions;
CREATE TRIGGER ua_forum_topic_reaction_counter_trigger
AFTER INSERT OR DELETE ON public.ua_forum_topic_reactions
FOR EACH ROW EXECUTE FUNCTION public.ua_sync_forum_reaction_counters();

DROP TRIGGER IF EXISTS ua_forum_comment_reaction_counter_trigger
  ON public.ua_forum_reactions;
CREATE TRIGGER ua_forum_comment_reaction_counter_trigger
AFTER INSERT OR DELETE ON public.ua_forum_reactions
FOR EACH ROW EXECUTE FUNCTION public.ua_sync_forum_reaction_counters();

UPDATE public.ua_forum_topics AS topic
SET reaction_count = (
  SELECT count(*)::INTEGER FROM public.ua_forum_topic_reactions AS reaction
  WHERE reaction.topic_id = topic.id
);
UPDATE public.ua_forum_comments AS comment
SET reaction_count = (
  SELECT count(*)::INTEGER FROM public.ua_forum_reactions AS reaction
  WHERE reaction.comment_id = comment.id
);

REVOKE ALL ON FUNCTION public.ua_consume_forum_rate_limit(BIGINT, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_toggle_forum_topic_reaction(BIGINT, BIGINT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_toggle_forum_comment_reaction(BIGINT, BIGINT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_create_forum_topic(BIGINT, TEXT, TEXT, TEXT, UUID, BIGINT[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_list_forum_topics(TEXT, TEXT, TEXT, BOOLEAN, BIGINT, TIMESTAMPTZ, BIGINT, INTEGER, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_list_forum_root_comments(BIGINT, TIMESTAMPTZ, BIGINT, INTEGER, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_enforce_forum_reply_depth()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_sync_forum_reaction_counters()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ua_consume_forum_rate_limit(BIGINT, TEXT, INTEGER, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_toggle_forum_topic_reaction(BIGINT, BIGINT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_toggle_forum_comment_reaction(BIGINT, BIGINT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_create_forum_topic(BIGINT, TEXT, TEXT, TEXT, UUID, BIGINT[])
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_list_forum_topics(TEXT, TEXT, TEXT, BOOLEAN, BIGINT, TIMESTAMPTZ, BIGINT, INTEGER, BOOLEAN)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_list_forum_root_comments(BIGINT, TIMESTAMPTZ, BIGINT, INTEGER, BOOLEAN)
  TO service_role;

REVOKE ALL ON FUNCTION public.ua_consume_forum_rate_limit(BIGINT, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_toggle_forum_topic_reaction(BIGINT, BIGINT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_toggle_forum_comment_reaction(BIGINT, BIGINT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_create_forum_topic(BIGINT, TEXT, TEXT, TEXT, UUID, BIGINT[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_enforce_forum_reply_depth()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ua_sync_forum_reaction_counters()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ua_consume_forum_rate_limit(BIGINT, TEXT, INTEGER, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_toggle_forum_topic_reaction(BIGINT, BIGINT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_toggle_forum_comment_reaction(BIGINT, BIGINT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ua_create_forum_topic(BIGINT, TEXT, TEXT, TEXT, UUID, BIGINT[])
  TO service_role;
