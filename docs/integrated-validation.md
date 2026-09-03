# Checkpoint de validação integrada

Data: 2026-09-03
Branch: `codex/continuar-taxonomias-academia`

Este diagnóstico foi executado sem conexão com produção, sem merge, deploy, Publish ou aplicação remota de migrations.

## Resultado local

- TypeScript: aprovado (`tsc --noEmit`).
- Build Vite/Nitro: aprovado.
- Lint direcionado dos arquivos alterados: aprovado, com a regra de `any` legado desativada conforme o checkpoint anterior.
- Testes Node: 17 aprovados, cobrindo os quatro papéis, novo usuário, compatibilidade de usuários existentes, elevação/redução lógica, cancelamento, retomada, propriedade da assinatura, expiração, evento antigo, contrato do ledger, catálogo público e associação editorial obrigatória.
- Aplicação: iniciou em `127.0.0.1` com variáveis locais fictícias, sem usar o `.env` remoto; `/`, `/receitas`, `/academia`, `/admin` e `/master` responderam HTTP 200.
- Capturas: página pública e barreira de login do Master foram registradas. Conteúdo autenticado e dados editoriais não puderam ser validados visualmente sem banco de teste.

## Bloqueio do Supabase local

O computador não possui Docker, Podman, Supabase CLI, PostgreSQL nem WSL. A pilha local oficial do Supabase depende de um runtime compatível com Docker.

Há também um bloqueio independente no repositório:

1. A primeira migration em `supabase/migrations` altera `ua_guides` e `ua_test_guides`, mas nenhuma migration anterior cria essas tabelas.
2. O baseline em `drizzle/migrations` cria parte das tabelas `ua_*`, porém não cria `public.touch_updated_at`, `public.subscriptions`, tabelas legadas presentes nos tipos, funções de autorização nem políticas/buckets de Storage.
3. `src/integrations/supabase/types.ts` comprova que esses objetos existiam quando os tipos foram gerados, mas não contém constraints, políticas, funções completas ou ownership suficiente para reconstruí-los sem invenção.
4. Não há dump ou migration histórica adicional no Git.

Conclusão: não foi possível executar honestamente migrations ou RLS em banco vazio, nem simular atualização sobre estrutura equivalente à atual.

## Procedimento remoto somente de leitura, sujeito a autorização

Se o baseline não estiver disponível em backup, a origem segura é um dump **somente de schema**, sem dados, usando uma credencial de banco temporária e somente leitura. O arquivo deve nascer fora de `supabase/migrations`, ser revisado e sanitizado, e só depois virar uma migration-base em commit separado.

Fluxo proposto:

1. criar uma credencial temporária de leitura para o banco de origem;
2. instalar Supabase CLI e um runtime Docker local;
3. executar `supabase db dump` com `--db-url`, `--schema public,auth,storage` e `--file` apontando para uma pasta de diagnóstico;
4. confirmar que o arquivo não contém dados, credenciais, owners específicos ou comandos destrutivos inesperados;
5. comparar objetos com os tipos gerados e com `drizzle/migrations`;
6. construir e revisar a migration-base;
7. executar `supabase db reset` somente no ambiente local/staging.

Não usar `supabase db pull` neste procedimento, pois ele também registra a migration no histórico remoto. Nunca usar `db reset --linked`, `db push` ou SQL Editor no projeto de origem.

## Stripe Test Mode

Nenhuma credencial Stripe de teste estava disponível. A etapa real ficou bloqueada sem afetar as demais. Foram executados apenas testes simulados, sem chamadas externas.

Variáveis necessárias no cofre do ambiente de staging, nunca no chat ou Git:

- `STRIPE_SECRET_KEY` de Test Mode;
- `STRIPE_WEBHOOK_SECRET` do endpoint de staging/Stripe CLI;
- `STRIPE_PRICE_ID` de um preço de teste;
- `STRIPE_PRODUCT_ID` de um produto de teste.

Os IDs agora vêm do ambiente. Há fallback legado temporário para compatibilidade de rollout, acompanhado de aviso no servidor; ele deve ser removido depois que todos os ambientes tiverem as novas variáveis.

## Correções realizadas neste checkpoint

- IDs de preço/produto Stripe configuráveis por ambiente, sem valores no `.env.example`.
- Ledger idempotente de webhooks e marcador temporal por assinatura, em migration aditiva e reversível.
- Eventos repetidos viram `duplicate`; eventos estritamente antigos não regressam o estado local; falhas ficam disponíveis para nova tentativa.
- Eventos de assinatura consultam o estado atual no Stripe antes da persistência, salvo fallback de exclusão já encerrada.
- Catálogo público da Academia deixou de retornar corpo do conteúdo, chave de PDF ou origem do vídeo.
- Rota pública de vídeo ficou restrita ao VSL configurado; vídeo de membro continua dependendo da autorização do backend.
- Conteúdos sem categoria/módulo podem permanecer como rascunho para correção, mas não podem ser publicados e não aparecem nas consultas publicadas.
- Arquivo legado e não utilizado com categorias fixas foi removido.

## Integração editorial

| Item | Resultado |
|---|---|
| Capas persistidas/recuperadas | Código grava `cover_image_key`/`cover_image_url` e lê ambos; teste real de Storage pendente. |
| Categorias/módulos dinâmicos | Fluxos ativos consultam tabelas de taxonomia; lista fixa legada removida. |
| Arquivados ocultos | Consultas de membro/públicas filtram `published`; taxonomias públicas filtram status. |
| Sem associação | Bloqueio no backend para publicação e filtro defensivo nas consultas publicadas. |
| Administração manual | Nome, slug, descrição, capa, ordem, status, PDF/vídeo e vínculo existem no Admin; validação real pendente. |
| Drive opcional | Não existe importador Drive. O cadastro manual é independente; link Drive de vídeo ainda precisa de integração/validação própria. |
| Admin Master integral | `admin_master` pode usar o Admin, mas vídeo introdutório por módulo, cortesia com prazo e visão completa de auditoria ainda não estão implementados. |

## Configuração mínima de staging

1. Projeto Supabase separado, sem dados de produção.
2. Baseline de schema completo, revisado e versionado.
3. Docker Desktop (ou runtime compatível) e Supabase CLI para `supabase start`/`supabase db reset` local.
4. Buckets privados de teste: `guias-pdf`, `guias-capas` e `funil-video`, com políticas revisadas.
5. Variáveis `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e equivalentes `VITE_*`, somente no cofre de staging.
6. Conta Stripe Test Mode, produto/preço de teste e webhook de staging.
7. Usuários sintéticos para `visitor`, `member`, `admin` e `admin_master`; nenhum dado pessoal real.

## Riscos de enviar agora ao Main preview

- migrations não reproduzíveis a partir do zero;
- migration do ledger ainda não executada em PostgreSQL/Supabase real;
- RLS, funções e Storage não validados em banco real;
- Stripe Test Mode não executado;
- preview precisaria receber as quatro novas variáveis Stripe antes da remoção futura do fallback;
- fluxo de vídeo via Google Drive não está validado e pode não ser reproduzível pelo player;
- validação visual autenticada, upload/substituição e responsividade de dados reais continuam pendentes.

Por esses motivos, a branch ainda não está pronta para merge nem para Main preview.
