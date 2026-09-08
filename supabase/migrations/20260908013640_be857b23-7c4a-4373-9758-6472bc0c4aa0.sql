CREATE TABLE IF NOT EXISTS public.ua_banners (
  slot text PRIMARY KEY,
  desktop_url text,
  tablet_url text,
  mobile_url text,
  alt_text text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ua_banners TO anon;
GRANT SELECT ON public.ua_banners TO authenticated;
GRANT ALL ON public.ua_banners TO service_role;
ALTER TABLE public.ua_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ua_banners_public_read" ON public.ua_banners;
CREATE POLICY "ua_banners_public_read" ON public.ua_banners FOR SELECT TO anon, authenticated USING (true);