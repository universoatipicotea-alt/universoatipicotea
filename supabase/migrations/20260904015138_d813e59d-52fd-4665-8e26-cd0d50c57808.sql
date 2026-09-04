ALTER TABLE public.ua_users ADD COLUMN IF NOT EXISTS access_role text NOT NULL DEFAULT 'visitor';

UPDATE public.ua_users
SET access_role = CASE
  WHEN role = 'master' THEN 'admin_master'
  WHEN role = 'admin' THEN 'admin'
  WHEN membership_status IN ('member','free') THEN 'member'
  ELSE 'visitor'
END;

ALTER TABLE public.ua_users
  ADD CONSTRAINT ua_users_access_role_check
  CHECK (access_role IN ('visitor','member','admin','admin_master'));