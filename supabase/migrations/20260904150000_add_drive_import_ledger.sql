-- Registro aditivo e reversível das importações assistidas do Google Drive.
-- Nenhuma política para authenticated/anon: somente o backend service_role acessa estas tabelas.

ALTER TABLE public.ua_academy_modules
  ADD COLUMN IF NOT EXISTS drive_folder_id text;

ALTER TABLE public.ua_guides
  ADD COLUMN IF NOT EXISTS drive_folder_id text;

CREATE UNIQUE INDEX IF NOT EXISTS ua_academy_modules_drive_folder_id_uidx
  ON public.ua_academy_modules(drive_folder_id)
  WHERE drive_folder_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ua_guides_drive_folder_id_uidx
  ON public.ua_guides(drive_folder_id)
  WHERE drive_folder_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ua_drive_import_batches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  root_folder_id text NOT NULL,
  covers_folder_id text,
  extra_folder_ids text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'preview'
    CHECK (status IN ('preview', 'importing', 'completed', 'partial', 'rolled_back')),
  requested_by bigint NOT NULL REFERENCES public.ua_users(id) ON DELETE RESTRICT,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.ua_drive_import_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id bigint NOT NULL REFERENCES public.ua_drive_import_batches(id) ON DELETE CASCADE,
  target_kind text NOT NULL CHECK (target_kind IN ('module_cover', 'academy_guide')),
  drive_folder_id text,
  drive_file_id text NOT NULL,
  cover_drive_file_id text,
  video_drive_file_id text,
  source_path text NOT NULL,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  suggested_module_id bigint REFERENCES public.ua_academy_modules(id) ON DELETE SET NULL,
  existing_target_id bigint,
  classification text NOT NULL,
  decision text NOT NULL DEFAULT 'pending'
    CHECK (decision IN ('pending', 'selected', 'ignored')),
  import_status text NOT NULL DEFAULT 'discovered'
    CHECK (import_status IN ('discovered', 'conflict', 'ignored', 'importing', 'imported', 'failed', 'rolled_back')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  prior_snapshot jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(batch_id, target_kind, drive_file_id)
);

CREATE TABLE IF NOT EXISTS public.ua_drive_assets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  import_item_id bigint REFERENCES public.ua_drive_import_items(id) ON DELETE SET NULL,
  drive_file_id text NOT NULL UNIQUE,
  drive_folder_id text,
  asset_role text NOT NULL CHECK (asset_role IN ('module_cover', 'guide_cover', 'pdf', 'video')),
  file_name text NOT NULL,
  mime_type text NOT NULL,
  drive_modified_at timestamptz,
  drive_version text,
  checksum text,
  storage_bucket text,
  storage_key text,
  module_id bigint REFERENCES public.ua_academy_modules(id) ON DELETE SET NULL,
  guide_id bigint REFERENCES public.ua_guides(id) ON DELETE SET NULL,
  import_status text NOT NULL DEFAULT 'imported'
    CHECK (import_status IN ('imported', 'superseded', 'rolled_back', 'failed')),
  imported_by bigint NOT NULL REFERENCES public.ua_users(id) ON DELETE RESTRICT,
  imported_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ua_drive_import_batches_requested_by_idx
  ON public.ua_drive_import_batches(requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS ua_drive_import_items_batch_idx
  ON public.ua_drive_import_items(batch_id, import_status, position);
CREATE INDEX IF NOT EXISTS ua_drive_assets_target_idx
  ON public.ua_drive_assets(module_id, guide_id, asset_role);

ALTER TABLE public.ua_drive_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ua_drive_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ua_drive_assets ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.ua_drive_import_batches TO service_role;
GRANT ALL ON public.ua_drive_import_items TO service_role;
GRANT ALL ON public.ua_drive_assets TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_drive_import_batches_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_drive_import_items_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_drive_assets_id_seq TO service_role;

CREATE TRIGGER ua_drive_import_batches_touch BEFORE UPDATE ON public.ua_drive_import_batches
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER ua_drive_import_items_touch BEFORE UPDATE ON public.ua_drive_import_items
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMENT ON TABLE public.ua_drive_import_batches IS
  'Lotes de prévia/importação do Drive; não contém credenciais.';
COMMENT ON TABLE public.ua_drive_assets IS
  'Proveniência por Drive file ID, independente do cadastro manual.';

-- Rollback manual da estrutura (não executar sem autorização e sem preservar a auditoria):
-- ALTER TABLE public.ua_guides DROP COLUMN IF EXISTS drive_folder_id;
-- ALTER TABLE public.ua_academy_modules DROP COLUMN IF EXISTS drive_folder_id;
-- DROP TABLE IF EXISTS public.ua_drive_assets;
-- DROP TABLE IF EXISTS public.ua_drive_import_items;
-- DROP TABLE IF EXISTS public.ua_drive_import_batches;
