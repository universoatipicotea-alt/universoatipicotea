-- Configuração visual responsiva, aditiva e opcional.
-- O cliente nunca acessa esta tabela diretamente: leitura e escrita passam pelo backend.

CREATE TABLE IF NOT EXISTS public.ua_visual_assets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot text NOT NULL UNIQUE
    CHECK (slot IN ('home', 'public_home', 'checkout', 'login', 'public_camila')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  internal_title text NOT NULL CHECK (char_length(btrim(internal_title)) BETWEEN 2 AND 160),
  desktop_image_key text,
  desktop_image_url text NOT NULL CHECK (char_length(btrim(desktop_image_url)) > 0),
  tablet_image_key text,
  tablet_image_url text,
  mobile_image_key text,
  mobile_image_url text,
  alt_text text NOT NULL CHECK (char_length(btrim(alt_text)) BETWEEN 2 AND 240),
  is_active boolean NOT NULL DEFAULT true,
  created_by bigint REFERENCES public.ua_users(id) ON DELETE SET NULL,
  updated_by bigint REFERENCES public.ua_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ua_visual_assets_active_slot_idx
  ON public.ua_visual_assets(slot)
  WHERE is_active = true;

ALTER TABLE public.ua_visual_assets ENABLE ROW LEVEL SECURITY;

-- Defesa em profundidade: nenhum papel do navegador recebe acesso SQL à configuração.
REVOKE ALL ON TABLE public.ua_visual_assets FROM anon, authenticated;
GRANT ALL ON TABLE public.ua_visual_assets TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_visual_assets_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.ua_visual_assets_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ua_visual_assets_touch_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ua_visual_assets_touch_updated_at() TO service_role;

DROP TRIGGER IF EXISTS ua_visual_assets_touch ON public.ua_visual_assets;
CREATE TRIGGER ua_visual_assets_touch
BEFORE UPDATE ON public.ua_visual_assets
FOR EACH ROW EXECUTE FUNCTION public.ua_visual_assets_touch_updated_at();

COMMENT ON TABLE public.ua_visual_assets IS
  'Slots visuais responsivos administrados somente pelo Admin Master via backend.';
COMMENT ON COLUMN public.ua_visual_assets.slot IS
  'Identificador estável consumido pelo frontend; não é derivado do nome editorial.';
COMMENT ON COLUMN public.ua_visual_assets.desktop_image_url IS
  'Variante obrigatória e fallback final para tablet e mobile.';

-- Rollback manual (não executar sem autorização e sem preservar auditoria):
-- DROP TABLE IF EXISTS public.ua_visual_assets;
-- DROP FUNCTION IF EXISTS public.ua_visual_assets_touch_updated_at();
