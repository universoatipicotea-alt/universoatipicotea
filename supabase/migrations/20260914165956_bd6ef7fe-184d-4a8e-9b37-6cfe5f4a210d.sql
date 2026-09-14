-- Aulas HTML ficam no bucket privado ou empacotadas no servidor; nunca em /public.
ALTER TABLE public.ua_guides ADD COLUMN IF NOT EXISTS html_key text;

UPDATE public.ua_academy_modules
SET name = 'Compreendendo o Autismo', slug = 'compreendendo-o-autismo',
    description = 'Fundamentos para compreender comunicação, interação, comportamentos e aspectos sensoriais.',
    status = 'published', position = 1, updated_at = now()
WHERE position = 1;
INSERT INTO public.ua_academy_modules (name, slug, description, status, position)
SELECT 'Compreendendo o Autismo', 'compreendendo-o-autismo',
       'Fundamentos para compreender comunicação, interação, comportamentos e aspectos sensoriais.',
       'published', 1
WHERE NOT EXISTS (SELECT 1 FROM public.ua_academy_modules WHERE position = 1);

WITH module AS (
  SELECT id, name FROM public.ua_academy_modules WHERE position = 1 LIMIT 1
), lessons(position, title, summary, html_key) AS (
  VALUES
    (1, 'Aula 01 — Comunicação e interação social', 'Comunicação e interação social.', 'bundled:module-01/aula-01'),
    (2, 'Aula 02 — Estereotipias e comportamentos repetitivos', 'Estereotipias e comportamentos repetitivos.', 'bundled:module-01/aula-02'),
    (3, 'Aula 03 — Alterações sensoriais', 'Alterações sensoriais.', 'bundled:module-01/aula-03')
)
INSERT INTO public.ua_guides (title, summary, category, module_id, content_type, html_key, status, position, published_at)
SELECT lessons.title, lessons.summary, module.name, module.id, 'html', lessons.html_key, 'published', lessons.position, now()
FROM lessons CROSS JOIN module
WHERE NOT EXISTS (SELECT 1 FROM public.ua_guides existing WHERE existing.html_key = lessons.html_key);

UPDATE public.ua_academy_modules
SET name = 'Linguagem e Comunicação', slug = 'linguagem-e-comunicacao',
    description = 'Bioquímica, inflamação, intestino e comunicação entre sistemas em uma trilha interativa.',
    status = 'published', position = 2, updated_at = now()
WHERE position = 2;
INSERT INTO public.ua_academy_modules (name, slug, description, status, position)
SELECT 'Linguagem e Comunicação', 'linguagem-e-comunicacao',
       'Bioquímica, inflamação, intestino e comunicação entre sistemas em uma trilha interativa.',
       'published', 2
WHERE NOT EXISTS (SELECT 1 FROM public.ua_academy_modules WHERE position = 2);

WITH module AS (
  SELECT id, name FROM public.ua_academy_modules WHERE position = 2 LIMIT 1
), lessons(position, title, summary, html_key) AS (
  VALUES
    (4, 'Aula 04 — O que a bioquímica investiga', 'O que a bioquímica investiga.', 'bundled:module-02/aula-04'),
    (5, 'Aula 05 — Inflamação', 'Inflamação e mecanismos relacionados.', 'bundled:module-02/aula-05'),
    (6, 'Aula 06 — Problemas intestinais no autismo', 'Problemas intestinais no autismo.', 'bundled:module-02/aula-06'),
    (7, 'Aula 07 — A relação intestino-cérebro', 'A relação intestino-cérebro.', 'bundled:module-02/aula-07'),
    (8, 'Aula 08 — Permeabilidade intestinal', 'Permeabilidade intestinal.', 'bundled:module-02/aula-08')
)
INSERT INTO public.ua_guides (title, summary, category, module_id, content_type, html_key, status, position, published_at)
SELECT lessons.title, lessons.summary, module.name, module.id, 'html', lessons.html_key, 'published', lessons.position, now()
FROM lessons CROSS JOIN module
WHERE NOT EXISTS (SELECT 1 FROM public.ua_guides existing WHERE existing.html_key = lessons.html_key);

INSERT INTO public.ua_academy_modules (name, slug, description, status, position)
VALUES (
  'Mecanismos Biológicos em Investigação',
  'mecanismos-biologicos-em-investigacao',
  'Inflamação, metabolismo, genética, nutrientes e condições relacionadas em uma trilha de investigação cuidadosa.',
  'published',
  3
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'published',
  position = 3,
  updated_at = now();

WITH module AS (
  SELECT id, name FROM public.ua_academy_modules
  WHERE slug = 'mecanismos-biologicos-em-investigacao'
), lessons(position, title, summary, html_key) AS (
  VALUES
    (9, 'Aula 09 — Inflamação, permeabilidade e condições relacionadas', 'Inflamação, permeabilidade e condições relacionadas.', 'bundled:module-03/aula-09'),
    (10, 'Aula 10 — Disfunção mitocondrial', 'Disfunção mitocondrial e mecanismos em investigação.', 'bundled:module-03/aula-10'),
    (11, 'Aula 11 — Polimorfismos genéticos', 'Polimorfismos genéticos e seus contextos de investigação.', 'bundled:module-03/aula-11'),
    (12, 'Aula 12 — Estresse oxidativo', 'Estresse oxidativo e mecanismos biológicos relacionados.', 'bundled:module-03/aula-12'),
    (13, 'Aula 13 — Deficiências nutricionais', 'Deficiências nutricionais e aspectos investigados.', 'bundled:module-03/aula-13'),
    (14, 'Aula 14 — A importância dos nutrientes', 'A importância dos nutrientes no contexto do módulo.', 'bundled:module-03/aula-14'),
    (15, 'Aula 15 — PANS/PANDAS', 'PANS/PANDAS: conceitos e pontos de investigação.', 'bundled:module-03/aula-15'),
    (16, 'Aula 16 — Síndrome fúngica', 'Síndrome fúngica e condições relacionadas em investigação.', 'bundled:module-03/aula-16')
)
INSERT INTO public.ua_guides (
  title, summary, category, module_id, content_type, html_key, status, position, published_at
)
SELECT lessons.title, lessons.summary, module.name, module.id, 'html', lessons.html_key,
       'published', lessons.position, now()
FROM lessons CROSS JOIN module
WHERE NOT EXISTS (
  SELECT 1 FROM public.ua_guides existing WHERE existing.html_key = lessons.html_key
);

COMMENT ON COLUMN public.ua_guides.html_key IS
  'Chave privada do HTML interativo ou identificador bundled: servido apenas pela rota autenticada.';