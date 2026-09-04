ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_stripe_event_id text,
  ADD COLUMN IF NOT EXISTS last_stripe_event_created_at timestamptz;

CREATE TABLE IF NOT EXISTS public.ua_audit_events (
  id bigserial PRIMARY KEY,
  actor_auth_id uuid,
  actor_user_id bigint,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  outcome text NOT NULL DEFAULT 'success',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_audit_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_audit_events_id_seq TO service_role;
ALTER TABLE public.ua_audit_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ua_stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  event_created_at timestamptz,
  status text NOT NULL DEFAULT 'claimed',
  outcome jsonb NOT NULL DEFAULT '{}'::jsonb,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT ALL ON public.ua_stripe_webhook_events TO service_role;
ALTER TABLE public.ua_stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_ua_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_event_created_at timestamptz
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted boolean := false;
BEGIN
  INSERT INTO public.ua_stripe_webhook_events (event_id, event_type, event_created_at, status)
  VALUES (p_event_id, p_event_type, p_event_created_at, 'claimed')
  ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted THEN
    RETURN 'claimed';
  END IF;
  RETURN 'duplicate';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ua_stripe_webhook_event(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ua_stripe_webhook_event(text, text, timestamptz) TO service_role;