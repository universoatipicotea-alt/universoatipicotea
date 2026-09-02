CREATE TABLE public.ua_recipe_categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image_key text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'published',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_recipe_categories TO service_role;
ALTER TABLE public.ua_recipe_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_academy_modules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image_key text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'published',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_academy_modules TO service_role;
ALTER TABLE public.ua_academy_modules ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER ua_recipe_categories_touch BEFORE UPDATE ON public.ua_recipe_categories
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER ua_academy_modules_touch BEFORE UPDATE ON public.ua_academy_modules
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.ua_guides
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'pdf',
  ADD COLUMN IF NOT EXISTS video_url text;

INSERT INTO public.ua_recipe_categories (name, slug, position) VALUES
  ('Café da manhã','cafe-da-manha',1),
  ('Almoço','almoco',2),
  ('Lanche','lanche',3),
  ('Jantar','jantar',4),
  ('Doces','doces',5),
  ('Bebidas','bebidas',6),
  ('Rápidas','rapidas',7),
  ('Outros','outros',8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.ua_academy_modules (name, slug, position) VALUES
  ('Módulo 1','modulo-1',1)
ON CONFLICT (slug) DO NOTHING;