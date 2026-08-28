# Universo Atípico — portar todas as páginas e publicar

Objetivo: reproduzir aqui, com as mesmas rotas e o mesmo visual do projeto original (o mesmo que está no ar em univ-atipico), agora rodando em TanStack Start + Lovable Cloud.

## Rotas (idênticas ao original)

| URL | Página |
| --- | --- |
| `/` | redireciona para `/entrar` |
| `/inicio` | Home |
| `/entrar` | Login / criar conta |
| `/comunidade` | Comunidade |
| `/biblioteca` | Biblioteca de guias |
| `/receitas` | Receitas |
| `/forum` | Fórum |
| `/facilitadores` | Facilitadores (com mapa) |
| `/ajuda` | Ajuda |
| `/perfil` | Perfil |
| `/academia-atipica` | Landing da Academia |
| `/academia` | Academia (área de membro) |
| `/assinatura`, `/checkout`, `/minha-assinatura` | Fluxo de assinatura |
| `/admin`, `/master` | Administração |
| `/produto/$slug` | Redirecionamento de produto |
| catch-all | Página 404 |

## Estrutura visual

Portar os três "shells" do original para componentes compartilhados:
- **PublicShell** — cabeçalho público com a logo oficial e navegação.
- **MemberShell / DashboardLayout** — área logada com menu lateral, avatar e navegação de membro.
- Marca, cores e tipografia continuam vindo dos tokens já definidos no design system atual (papel, tinta, azul, vermelho, verde, dourado).

Componentes portados: Brand, PdfReader, RecipeCover, AIChatBox, Map, AccessControlPanel, ErrorBoundary, skeletons.

## Backend (Lovable Cloud)

O servidor Express/MySQL original não roda aqui; a lógica equivalente vira funções de servidor sobre o banco já criado:
- Autenticação por e-mail/senha (e Google), perfis e papéis (membro / staff / master).
- Guias e biblioteca, progresso de leitura e anotações.
- Comunidade: posts, comentários, fórum e tópicos.
- Facilitadores e receitas.
- Assinatura: registro de plano e estado da assinatura (pagamento real fica para uma etapa posterior, se você quiser).
- PDF protegido: o arquivo nunca é servido por URL pública; a validação de acesso acontece no servidor antes de entregar o conteúdo.

## Conteúdo

Migrar os dados de exemplo do projeto original (guias, receitas, facilitadores, textos de ajuda) por migração com inserts, para que as páginas já abram preenchidas.

## Ordem de execução

1. Shells + rotas públicas (`/inicio`, `/entrar`, `/biblioteca`, `/receitas`, `/academia-atipica`, `/ajuda`, 404).
2. Autenticação e área de membro (`/comunidade`, `/forum`, `/facilitadores`, `/perfil`, `/academia`).
3. Assinatura, admin/master e leitor de PDF protegido.
4. Seed de conteúdo, verificação de build e publicação.

## Detalhes técnicos

- Rotas em `src/routes/` com `createFileRoute`; subárvore autenticada sob `_authenticated` com guarda de sessão.
- Dados via `createServerFn` + TanStack Query (loader `ensureQueryData` + `useSuspenseQuery` onde fizer sentido).
- Papéis em tabela `user_roles` separada com função `has_role`; RLS + GRANTs em todas as tabelas novas.
- PDFs em bucket privado, entregues por função de servidor após checar papel/assinatura.
- Mapa de facilitadores carregado apenas no cliente (import dinâmico atrás de `ClientOnly`).
- `head()` próprio em cada rota, com título e descrição específicos.
