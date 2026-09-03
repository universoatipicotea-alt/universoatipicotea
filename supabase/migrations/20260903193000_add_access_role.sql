-- Migração aditiva e reversível: nenhuma coluna legada ou usuário é removido.
ALTER TABLE public.ua_users
  ADD COLUMN IF NOT EXISTS access_role text NOT NULL DEFAULT 'visitor';

DO $$
BEGIN
  ALTER TABLE public.ua_users
    ADD CONSTRAINT ua_users_access_role_check
    CHECK (access_role IN ('visitor', 'member', 'admin', 'admin_master'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill determinístico. Impacta somente a nova coluna access_role.
UPDATE public.ua_users
SET access_role = CASE
  WHEN role = 'master' THEN 'admin_master'
  WHEN role = 'admin' THEN 'admin'
  WHEN membership_status IN ('member', 'free') THEN 'member'
  ELSE 'visitor'
END;

CREATE INDEX IF NOT EXISTS ua_users_access_role_idx
  ON public.ua_users(access_role, account_status);

COMMENT ON COLUMN public.ua_users.access_role IS
  'Fonte única de autorização: visitor, member, admin ou admin_master.';

-- Verificações RLS: acesso direto do navegador continua sem política permissiva.
ALTER TABLE public.ua_users ENABLE ROW LEVEL SECURITY;

-- Rollback (executar somente depois de reverter o código):
-- DROP INDEX IF EXISTS public.ua_users_access_role_idx;
-- ALTER TABLE public.ua_users DROP COLUMN IF EXISTS access_role;
