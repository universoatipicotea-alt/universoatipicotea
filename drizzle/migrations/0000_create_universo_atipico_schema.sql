CREATE TABLE public.ua_users (
  id BIGSERIAL PRIMARY KEY,
  auth_id UUID UNIQUE,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','master')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended')),
  membership_status TEXT NOT NULL DEFAULT 'member' CHECK (membership_status IN ('member','free','canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_users TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_users_id_seq TO service_role;
ALTER TABLE public.ua_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES public.ua_users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT,
  avatar_key TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_profiles TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_profiles_id_seq TO service_role;
ALTER TABLE public.ua_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES public.ua_users(id) ON DELETE CASCADE,
  notify_guides BOOLEAN NOT NULL DEFAULT true,
  notify_replies BOOLEAN NOT NULL DEFAULT true,
  notify_community BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_preferences TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_preferences_id_seq TO service_role;
ALTER TABLE public.ua_preferences ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_guides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  pdf_key TEXT,
  pdf_url TEXT,
  cover_image_key TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  position INTEGER NOT NULL DEFAULT 0,
  created_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_guides TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_guides_id_seq TO service_role;
ALTER TABLE public.ua_guides ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_test_guides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  callout TEXT,
  accent_color TEXT NOT NULL DEFAULT '#0b2b26',
  cover_image_key TEXT,
  cover_image_url TEXT,
  pdf_key TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_test_guides TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_test_guides_id_seq TO service_role;
ALTER TABLE public.ua_test_guides ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_facilitators (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  source_label TEXT,
  link_url TEXT,
  image_key TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  position INTEGER NOT NULL DEFAULT 0,
  created_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_facilitators TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_facilitators_id_seq TO service_role;
ALTER TABLE public.ua_facilitators ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_forum_topics (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  author_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_forum_topics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_forum_topics_id_seq TO service_role;
ALTER TABLE public.ua_forum_topics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_forum_comments (
  id BIGSERIAL PRIMARY KEY,
  topic_id BIGINT NOT NULL REFERENCES public.ua_forum_topics(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_forum_comments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_forum_comments_id_seq TO service_role;
ALTER TABLE public.ua_forum_comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  external_url TEXT NOT NULL,
  cover_image_key TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured_on_home BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_products TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_products_id_seq TO service_role;
ALTER TABLE public.ua_products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  product_id BIGINT NOT NULL REFERENCES public.ua_products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  landing_url TEXT,
  notes TEXT,
  created_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_campaigns TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_campaigns_id_seq TO service_role;
ALTER TABLE public.ua_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_product_clicks (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.ua_products(id) ON DELETE CASCADE,
  campaign_id BIGINT REFERENCES public.ua_campaigns(id) ON DELETE SET NULL,
  origin TEXT NOT NULL DEFAULT 'public' CHECK (origin IN ('public','client')),
  campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_product_clicks TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_product_clicks_id_seq TO service_role;
ALTER TABLE public.ua_product_clicks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_conversions (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.ua_products(id) ON DELETE CASCADE,
  campaign_id BIGINT REFERENCES public.ua_campaigns(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','integration')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','reversed')),
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'BRL',
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_conversions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_conversions_id_seq TO service_role;
ALTER TABLE public.ua_conversions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_landing_settings (
  id BIGSERIAL PRIMARY KEY,
  show_product_shelf BOOLEAN NOT NULL DEFAULT true,
  product_shelf_title TEXT NOT NULL DEFAULT 'Escolhas que podem apoiar sua jornada',
  product_shelf_description TEXT NOT NULL DEFAULT 'Recomendações externas escolhidas pelo Universo Atípico. A comunidade continua gratuita e a decisão é sempre sua.',
  updated_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_landing_settings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_landing_settings_id_seq TO service_role;
ALTER TABLE public.ua_landing_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_reading_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('guide','testGuide')),
  document_id BIGINT NOT NULL,
  current_page INTEGER NOT NULL DEFAULT 1,
  page_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, document_id)
);
GRANT ALL ON public.ua_reading_progress TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_reading_progress_id_seq TO service_role;
ALTER TABLE public.ua_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_pdf_annotations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('guide','testGuide')),
  document_id BIGINT NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_pdf_annotations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_pdf_annotations_id_seq TO service_role;
ALTER TABLE public.ua_pdf_annotations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_access_levels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT NOT NULL DEFAULT '[]',
  created_by BIGINT REFERENCES public.ua_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ua_access_levels TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_access_levels_id_seq TO service_role;
ALTER TABLE public.ua_access_levels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ua_user_access_levels (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.ua_users(id) ON DELETE CASCADE,
  access_level_id BIGINT NOT NULL REFERENCES public.ua_access_levels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, access_level_id)
);
GRANT ALL ON public.ua_user_access_levels TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ua_user_access_levels_id_seq TO service_role;
ALTER TABLE public.ua_user_access_levels ENABLE ROW LEVEL SECURITY;

INSERT INTO public.ua_landing_settings (show_product_shelf) VALUES (true);
