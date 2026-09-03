-- Aditiva: impede reprocessamento e regressão por webhooks Stripe fora de ordem.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS last_stripe_event_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_stripe_event_id text;

CREATE TABLE IF NOT EXISTS public.ua_stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  event_created_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'applied', 'ignored', 'failed')),
  outcome jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ua_stripe_webhook_events_created_at_idx
  ON public.ua_stripe_webhook_events(event_created_at DESC);

ALTER TABLE public.ua_stripe_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ua_stripe_webhook_events TO service_role;

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
  claimed_id text;
BEGIN
  INSERT INTO public.ua_stripe_webhook_events (
    event_id, event_type, event_created_at, status
  ) VALUES (
    p_event_id, p_event_type, p_event_created_at, 'processing'
  )
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO claimed_id;

  IF claimed_id IS NOT NULL THEN
    RETURN 'claimed';
  END IF;

  UPDATE public.ua_stripe_webhook_events
  SET status = 'processing', outcome = '{}'::jsonb, processed_at = NULL
  WHERE event_id = p_event_id AND status = 'failed'
  RETURNING event_id INTO claimed_id;

  RETURN CASE WHEN claimed_id IS NULL THEN 'duplicate' ELSE 'claimed' END;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ua_stripe_webhook_event(text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ua_stripe_webhook_event(text, text, timestamptz)
  TO service_role;

COMMENT ON TABLE public.ua_stripe_webhook_events IS
  'Ledger idempotente de eventos Stripe; não armazena payloads nem segredos.';

-- Rollback (somente após reverter o código e preservar diagnóstico necessário):
-- DROP FUNCTION IF EXISTS public.claim_ua_stripe_webhook_event(text, text, timestamptz);
-- DROP TABLE IF EXISTS public.ua_stripe_webhook_events;
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS last_stripe_event_id;
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS last_stripe_event_created_at;
