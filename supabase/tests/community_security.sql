-- Execute em ambiente de teste após aplicar a migration da comunidade.
BEGIN;

DO $community_security$
DECLARE
  bucket_public BOOLEAN;
BEGIN
  IF to_regclass('public.ua_forum_topic_reactions') IS NULL THEN
    RAISE EXCEPTION 'Tabela ua_forum_topic_reactions ausente';
  END IF;
  IF to_regclass('public.ua_forum_attachments') IS NULL THEN
    RAISE EXCEPTION 'Tabela ua_forum_attachments ausente';
  END IF;
  IF to_regclass('public.ua_forum_rate_limits') IS NULL THEN
    RAISE EXCEPTION 'Tabela ua_forum_rate_limits ausente';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.ua_forum_attachments'::regclass) THEN
    RAISE EXCEPTION 'RLS precisa estar habilitado nos anexos';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.ua_forum_rate_limits'::regclass) THEN
    RAISE EXCEPTION 'RLS precisa estar habilitado nos limites';
  END IF;

  SELECT public INTO bucket_public FROM storage.buckets WHERE id = 'community-media';
  IF bucket_public IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'O bucket community-media precisa ser privado';
  END IF;

  IF has_function_privilege('anon', 'public.ua_consume_forum_rate_limit(bigint,text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon não pode executar o rate limit interno';
  END IF;
  IF has_function_privilege('authenticated', 'public.ua_create_forum_topic(bigint,text,text,text,uuid,bigint[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated não pode chamar diretamente a criação privilegiada';
  END IF;
END;
$community_security$;

ROLLBACK;
