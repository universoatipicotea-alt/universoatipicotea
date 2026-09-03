-- 1. Ajuste de nomes de categorias
UPDATE public.ua_recipe_categories SET name='Lanches', slug='lanches', updated_at=now() WHERE slug='lanche';
UPDATE public.ua_recipe_categories SET name='Sobremesas', slug='sobremesas', updated_at=now() WHERE slug='doces';

-- 2. Módulos da Academia
UPDATE public.ua_academy_modules SET name='Primeiros Passos', slug='primeiros-passos', position=1, status='published', updated_at=now() WHERE slug='modulo-1';

INSERT INTO public.ua_academy_modules (name, slug, status, position)
SELECT v.name, v.slug, 'published', v.position
FROM (VALUES
  ('Primeiros Passos','primeiros-passos',1),
  ('Comunicação','comunicacao',2),
  ('Alimentação','alimentacao',3),
  ('Sono','sono',4),
  ('Escola','escola',5),
  ('Comportamento e Regulação','comportamento-e-regulacao',6),
  ('Rotina e Autonomia','rotina-e-autonomia',7),
  ('Brincar e Interação','brincar-e-interacao',8),
  ('Direitos','direitos',9),
  ('Desenvolvimento','desenvolvimento',10),
  ('Família','familia',11)
) AS v(name, slug, position)
WHERE NOT EXISTS (SELECT 1 FROM public.ua_academy_modules m WHERE m.slug = v.slug);

-- 3. Receitas: categoria real + ordem
ALTER TABLE public.ua_test_guides
  ADD COLUMN IF NOT EXISTS category_id bigint REFERENCES public.ua_recipe_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS ua_test_guides_category_id_idx ON public.ua_test_guides(category_id);

UPDATE public.ua_test_guides g
SET category_id = c.id
FROM public.ua_recipe_categories c
WHERE g.category_id IS NULL
  AND lower(translate(g.category,'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))
      = lower(translate(c.name,'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'));

UPDATE public.ua_test_guides g
SET category_id = (SELECT id FROM public.ua_recipe_categories WHERE slug='outros' LIMIT 1)
WHERE g.category_id IS NULL;

UPDATE public.ua_test_guides g
SET category = c.name
FROM public.ua_recipe_categories c
WHERE g.category_id = c.id AND g.category IS DISTINCT FROM c.name;

-- 4. Academia: módulo, duração, revisão técnica
ALTER TABLE public.ua_guides
  ADD COLUMN IF NOT EXISTS module_id bigint REFERENCES public.ua_academy_modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_duration text,
  ADD COLUMN IF NOT EXISTS technical_review text;
CREATE INDEX IF NOT EXISTS ua_guides_module_id_idx ON public.ua_guides(module_id);

UPDATE public.ua_guides g
SET module_id = m.id
FROM public.ua_academy_modules m
WHERE g.module_id IS NULL
  AND lower(translate(g.category,'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))
      = lower(translate(m.name,'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'));

UPDATE public.ua_guides SET module_id = (SELECT id FROM public.ua_academy_modules WHERE slug='rotina-e-autonomia' LIMIT 1)
WHERE module_id IS NULL AND category ILIKE 'Rotina%';

UPDATE public.ua_guides SET module_id = (SELECT id FROM public.ua_academy_modules WHERE slug='primeiros-passos' LIMIT 1)
WHERE module_id IS NULL;

UPDATE public.ua_guides g
SET category = m.name
FROM public.ua_academy_modules m
WHERE g.module_id = m.id AND g.category IS DISTINCT FROM m.name;

UPDATE public.ua_guides SET content_type = 'pdf' WHERE content_type IS NULL;

-- 5. Progresso: vídeo, conclusão e último acesso
ALTER TABLE public.ua_reading_progress
  ADD COLUMN IF NOT EXISTS last_second integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_access_at timestamptz NOT NULL DEFAULT now();