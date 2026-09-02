# Receitas por categoria + Academia Atípica em módulos (com vídeos)

## Receitas — navegação por categoria

- `/receitas` passa a mostrar **capas de categoria** (grid de cards), não a lista completa.
- Cada card mostra: capa enviada no Admin, nome da categoria e quantidade de receitas publicadas.
- Ao clicar, abre `/receitas/<categoria>` com a lista de receitas daquela categoria (mesmo card atual, busca e leitor de PDF preservados) e um botão "Voltar para categorias".
- Categorias vêm de um cadastro real no Admin (nome, capa, ordem, status), não mais de uma lista fixa no código.
- Receitas sem categoria válida caem em "Outros".

## Academia Atípica — módulos + vídeos

- Categorias da Academia passam a se chamar **Módulos** (Módulo 1, Módulo 2...), apenas nome + capa + ordem.
- `/academia` mostra capas dos módulos; clicar abre `/academia/<modulo>` com os conteúdos daquele módulo.
- Cada conteúdo pode ser **PDF** (leitor interno atual) ou **Vídeo** (link do Google Drive, igual à VSL, servido pelo proxy interno já existente `/api/public/ua-video`).
- Card de vídeo mostra selo "Vídeo"; ao abrir, toca no player interno da plataforma.
- "Continue de onde parou" continua funcionando para PDFs; vídeos guardam o último ponto assistido.
- Conteúdo é sempre de guias/temas (não alimentação); receitas ficam só em `/receitas`.

## Administração (Admin e Admin Master)

- Nova aba **Categorias de Receitas**: criar/editar/ordenar categorias, upload de capa, status (Rascunho/Publicado/Arquivado).
- Nova aba **Módulos da Academia**: mesma estrutura (nome, capa, ordem, status).
- No editor de Receita: selecionar a categoria a partir do cadastro.
- No editor de conteúdo da Academia: escolher **Tipo** (PDF ou Vídeo), o **Módulo**, capa e, para vídeo, o campo de link do Google Drive.
- Todas as telas seguem o padrão visual da tela Gestão → Receitas (Toolbar, Card, StatusPill, EmptyState).

## Detalhes técnicos

- Novas tabelas: `ua_recipe_categories` e `ua_academy_modules` (slug, nome, capa, posição, status) com GRANTs e RLS (leitura pública dos publicados; escrita só para staff).
- `ua_test_guides` (receitas) ganha `category_id`; `ua_guides` (academia) ganha `module_id`, `content_type` ('pdf' | 'video') e `video_url`.
- Migração de dados: categorias atuais viram registros reais; guias existentes vão para "Módulo 1".
- Novas rotas TanStack: `src/routes/receitas.$categoria.tsx` e `src/routes/academia.$modulo.tsx`.
- Endpoints tRPC em `community.server.ts`: listagem pública de categorias/módulos e CRUD admin correspondente.
- Reuso do proxy de vídeo do Drive já usado pela VSL — sem mudanças em Stripe, checkout ou webhooks.
