-- Expande a tabela de banners existente para a gestão visual responsiva do Admin Master.
-- Migration aditiva: preserva todos os slots e URLs já cadastrados.

ALTER TABLE public.ua_banners
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS internal_title text,
  ADD COLUMN IF NOT EXISTS desktop_key text,
  ADD COLUMN IF NOT EXISTS tablet_key text,
  ADD COLUMN IF NOT EXISTS mobile_key text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Preenche apenas metadados ausentes; imagens e demais dados existentes não são alterados.
UPDATE public.ua_banners
SET name = initcap(replace(replace(slot, '_', ' '), '-', ' '))
WHERE name IS NULL OR btrim(name) = '';

UPDATE public.ua_banners
SET internal_title = name
WHERE internal_title IS NULL OR btrim(internal_title) = '';

ALTER TABLE public.ua_banners
  ALTER COLUMN name SET DEFAULT 'Banner da plataforma',
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN internal_title SET DEFAULT 'Banner da plataforma',
  ALTER COLUMN internal_title SET NOT NULL;

CREATE INDEX IF NOT EXISTS ua_banners_active_slot_idx
  ON public.ua_banners(slot)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.ua_banners_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ua_banners_touch_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ua_banners_touch_updated_at() TO service_role;

DROP TRIGGER IF EXISTS ua_banners_touch ON public.ua_banners;
CREATE TRIGGER ua_banners_touch
BEFORE UPDATE ON public.ua_banners
FOR EACH ROW EXECUTE FUNCTION public.ua_banners_touch_updated_at();

ALTER TABLE public.ua_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ua_banners_public_read" ON public.ua_banners;

-- Leitura e escrita passam pelo backend; papéis do navegador não acessam a tabela diretamente.
REVOKE ALL ON TABLE public.ua_banners FROM anon, authenticated;
GRANT ALL ON TABLE public.ua_banners TO service_role;

COMMENT ON TABLE public.ua_banners IS
  'Slots visuais responsivos administrados pelo Admin Master via backend.';
COMMENT ON COLUMN public.ua_banners.slot IS
  'Identificador estável do local de exibição; não depende do nome editorial.';
COMMENT ON COLUMN public.ua_banners.desktop_url IS
  'Variante desktop e fallback final para tablet e mobile.';
COMMENT ON COLUMN public.ua_banners.updated_by IS
  'UUID auth.users do último Admin Master responsável pela alteração.';

-- Rollback manual (não executar sem autorização): remova somente as colunas,
-- o índice, o trigger e a função adicionados acima; preserve ua_banners e seus dados.
