-- Executar em banco local/teste depois das migrations. Não executar em produção.
DO $$
DECLARE
  rls_enabled boolean;
  permissive_policy_count integer;
  role_constraint_count integer;
BEGIN
  SELECT c.relrowsecurity
    INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'ua_users';

  IF rls_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'RLS precisa estar habilitado em public.ua_users';
  END IF;

  SELECT count(*)
    INTO permissive_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'ua_users'
    AND roles && ARRAY['anon', 'authenticated']::name[];

  IF permissive_policy_count <> 0 THEN
    RAISE EXCEPTION 'ua_users não deve possuir política direta para anon/authenticated';
  END IF;

  SELECT count(*)
    INTO role_constraint_count
  FROM pg_constraint
  WHERE conrelid = 'public.ua_users'::regclass
    AND conname = 'ua_users_access_role_check';

  IF role_constraint_count <> 1 THEN
    RAISE EXCEPTION 'Constraint de access_role ausente';
  END IF;
END $$;
