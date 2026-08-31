ALTER TABLE public.ua_guides DROP CONSTRAINT IF EXISTS ua_guides_status_check;
ALTER TABLE public.ua_guides ADD CONSTRAINT ua_guides_status_check CHECK (status = ANY (ARRAY['draft'::text,'published'::text,'archived'::text]));
ALTER TABLE public.ua_test_guides DROP CONSTRAINT IF EXISTS ua_test_guides_status_check;
ALTER TABLE public.ua_test_guides ADD CONSTRAINT ua_test_guides_status_check CHECK (status = ANY (ARRAY['draft'::text,'published'::text,'archived'::text]));