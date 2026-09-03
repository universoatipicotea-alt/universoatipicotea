-- Aditiva: mantém compatibilidade com versões anteriores da aplicação.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz;

CREATE TABLE IF NOT EXISTS public.ua_audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_auth_id uuid,
  actor_user_id bigint REFERENCES public.ua_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'noop')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ua_audit_events_actor_user_id_idx
  ON public.ua_audit_events(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ua_audit_events_action_idx
  ON public.ua_audit_events(action, created_at DESC);

ALTER TABLE public.ua_audit_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ua_audit_events TO service_role;

COMMENT ON TABLE public.ua_audit_events IS
  'Histórico imutável de ações sensíveis executadas pelo backend; não armazena segredos.';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS
  'Estado confirmado por webhook do Stripe; true mantém acesso até current_period_end.';

-- Rollback documentado (executar somente em mudança autorizada e após preservar auditoria):
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cancel_requested_at;
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cancel_at_period_end;
-- DROP TABLE IF EXISTS public.ua_audit_events;
