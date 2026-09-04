-- Estados editoriais dos módulos da Academia.
-- Migration aditiva: preserva módulos e conteúdos existentes.

ALTER TABLE public.ua_academy_modules
  ADD COLUMN IF NOT EXISTS coming_soon_message text NOT NULL
  DEFAULT 'Estamos preparando este módulo com cuidado. Em breve, novos conteúdos estarão disponíveis para você.';

ALTER TABLE public.ua_academy_modules
  DROP CONSTRAINT IF EXISTS ua_academy_modules_status_check;

ALTER TABLE public.ua_academy_modules
  ADD CONSTRAINT ua_academy_modules_status_check
  CHECK (status IN ('draft', 'published', 'coming_soon', 'archived'));

UPDATE public.ua_academy_modules
SET
  status = 'coming_soon',
  coming_soon_message = 'Estamos preparando este módulo com cuidado. Em breve, novos conteúdos estarão disponíveis para você.',
  updated_at = now()
WHERE slug IN (
  'rotina-e-autonomia',
  'brincar-e-interacao',
  'direitos',
  'desenvolvimento',
  'familia'
);

COMMENT ON COLUMN public.ua_academy_modules.coming_soon_message IS
  'Mensagem exibida no card bloqueado quando o módulo está em coming_soon.';

-- Rollback manual (não executar sem autorização):
-- UPDATE public.ua_academy_modules SET status = 'draft' WHERE status = 'coming_soon';
-- ALTER TABLE public.ua_academy_modules DROP CONSTRAINT IF EXISTS ua_academy_modules_status_check;
-- ALTER TABLE public.ua_academy_modules DROP COLUMN IF EXISTS coming_soon_message;
