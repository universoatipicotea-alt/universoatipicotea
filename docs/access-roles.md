# Papéis e acesso — impacto antes da migração

## Fonte única de verdade

A nova coluna `ua_users.access_role` será a única fonte de autorização da aplicação:

| Papel          | Acesso                                                                               |
| -------------- | ------------------------------------------------------------------------------------ |
| `visitor`      | página pública, autenticação, checkout e telas públicas; sem conteúdo premium        |
| `member`       | conteúdo premium, progresso, anotações, perfil e comunidade de membros               |
| `admin`        | tudo de membro mais gestão editorial; sem operações exclusivas do Admin Master       |
| `admin_master` | tudo de admin mais usuários, acessos, assinaturas, auditoria e configurações globais |

`account_status = suspended` bloqueia todos os papéis autenticados no backend. O frontend apenas reflete a decisão do servidor.

## Impacto nos usuários existentes

A migration adiciona uma coluna e faz um único backfill, sem apagar usuários:

- `role = master` passa a `access_role = admin_master`;
- `role = admin` passa a `access_role = admin`;
- `role = user` com `membership_status = member` ou `free` passa a `access_role = member`;
- os demais passam a `access_role = visitor`.

As colunas antigas `role` e `membership_status` permanecem durante a transição para rollback e compatibilidade. Elas deixam de autorizar ações. Escritas administrativas e webhooks ainda as espelham temporariamente para versões antigas do código.

O backfill atualiza todos os registros de `ua_users`, mas somente a nova coluna. Não altera `auth_id`, e-mail, senha, assinatura, progresso, conteúdo ou dados pessoais.

## Ciclo de vida

- Novo usuário sem pagamento confirmado: `visitor`.
- Pagamento confirmado por sessão ou webhook: `member`.
- Cancelamento agendado: continua `member` até o fim do período.
- Assinatura efetivamente encerrada ou expirada: `visitor` após webhook confirmado.
- Cortesia: `member`; o prazo será controlado em migration posterior do Admin Master.
- Promoção administrativa: somente um `admin_master` ativo pode atribuir `admin` ou `admin_master`.

## RLS e backend

As tabelas sensíveis permanecem com RLS habilitado e sem políticas diretas para `anon` ou `authenticated`. O navegador não recebe a chave `service_role`. Toda autorização acontece novamente no dispatcher do backend por `access_role`; esconder botões não concede nem revoga acesso.

## Reversão

1. Reverter o commit de código para voltar a ler as colunas legadas.
2. Somente depois, em migration autorizada, executar `DROP INDEX ...` e `DROP COLUMN access_role`.

Como as colunas antigas não são removidas, o rollback não exige reconstrução de tabela nem restauração de usuários.
