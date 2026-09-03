# Auditoria SaaS — Universo Atípico

Atualizado em 03/09/2026 na branch `codex/continuar-taxonomias-academia`.

Esta matriz é incremental. “Precisa de teste” significa que há implementação no código, mas ainda não houve validação autenticada ou ponta a ponta nesta branch. Nenhum item deve ser considerado concluído apenas por compilar.

| # | Área | Estado atual | Evidência e próximo passo |
|---|---|---|---|
| 1 | Página pública | precisa de teste | Landing, VSL e rotas legais existem; validar navegação, conteúdo e responsividade no preview. |
| 2 | Login e recuperação de senha | precisa de teste | Login, solicitação de redefinição e nova senha existem; testar e-mail, expiração e redirecionamentos reais. |
| 3 | Fluxo de compra | precisa de teste | Checkout Stripe existe; testar cenários aprovado, pendente, recusado, cancelado e retorno. |
| 4 | Liberação de conta após pagamento | precisa de teste | `billing.activate` e ativação por sessão existem; validar idempotência e conta preexistente. |
| 5 | Stripe e webhooks | parcial | Assinatura de webhook é verificada e eventos são processados. Cancelamento local não cancela a assinatura no Stripe; qualquer correção será apresentada antes. |
| 6 | Área de membros | precisa de teste | Shell, dashboard e bloqueios existem; validar todos os estados de acesso. |
| 7 | Academia | parcial | Hub, módulos, PDF/vídeo e progresso foram ligados ao novo modelo. Falta QA visual/autenticado e pré-visualização editorial. |
| 8 | Receitas | parcial | Hub, categorias dinâmicas, capas, favoritos locais e leitor existem. Falta QA autenticado e persistência de favoritos no servidor. |
| 9 | Biblioteca | parcial | Busca, filtros e leitor interno existem. Falta organização pessoal/favoritos e QA integral. |
| 10 | PDFs | precisa de teste | PDF privado é resolvido por RPC autenticado com URL assinada; validar expiração, substituição e acesso negado. |
| 11 | Vídeos | parcial | Vídeo armazenado da Academia agora exige assinatura e recebe URL temporária; links externos dependem da proteção do provedor. |
| 12 | Progresso | parcial | Leitura e vídeo gravam progresso; testar retomada, concorrência e conclusão em dispositivos distintos. |
| 13 | Anotações | precisa de teste | CRUD por usuário e documento existe no leitor; validar isolamento e erros. |
| 14 | Perfil | precisa de teste | Página e operações existem; validar alteração de dados e avatar. |
| 15 | Admin | parcial | Conteúdos, receitas, categorias e módulos têm edição manual; falta prévia completa, arquivamento e revisão de permissões. |
| 16 | Admin Master | parcial | Produtos, campanhas, contas, acessos, categorias e módulos existem. Faltam cortesia com prazo, visão de progresso/assinatura e auditoria. |
| 17 | Permissões e RLS | inseguro | O backend usa cliente service-role e depende integralmente das verificações da camada de aplicação; auditar toda operação e políticas RLS. |
| 18 | Armazenamento | precisa de teste | Buckets privados, uploads e URLs assinadas existem; validar políticas, tipos, limites, substituição e arquivos órfãos. |
| 19 | Responsividade | precisa de teste | Há breakpoints e navegação móvel, mas falta matriz visual desktop/mobile das rotas obrigatórias. |
| 20 | Erros e carregamento | parcial | As telas principais têm estados básicos; padronizar falhas de mutation, retry e indisponibilidade. |
| 21 | Logs e auditoria | ausente | Há logs técnicos, inclusive webhook, mas não existe histórico administrativo estruturado e consultável. |
| 22 | Variáveis e arquivos | inseguro | `.env` está versionado. Avaliar remoção segura do rastreamento e rotação apenas após aprovação, sem expor valores. |

## Bloqueios críticos já identificados

- O cancelamento em `community.subscription.cancel` altera apenas o acesso local e não cancela a assinatura no Stripe.
- O status `visitor` criado para novas contas precisa ser reconciliado com as restrições e tipos do banco.
- O uso de `service-role` torna obrigatória uma revisão completa de autorização em cada endpoint.
- O arquivo `.env` versionado exige plano de remoção e possível rotação de credenciais; nenhuma credencial deve ser copiada para documentação ou commits.

## Regra de conclusão

O SaaS somente poderá ser marcado como concluído após testes autenticados, fluxo completo de pagamento em ambiente seguro, validação de webhooks, matriz responsiva e revisão de segurança. Build bem-sucedido não substitui esses testes.
