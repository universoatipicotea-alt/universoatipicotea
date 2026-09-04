# Cancelamento de assinatura — desenho antes da alteração

## Comportamento atual

`community.subscription.cancel` altera imediatamente `ua_users.membership_status` para `canceled`. A operação não chama a API do Stripe, não agenda o cancelamento da cobrança, não preserva o acesso até o fim do período e não possui reversão. Portanto, a interface pode dizer “cancelada” enquanto a assinatura continua sendo cobrada.

## Comportamento novo

1. O backend localiza a assinatura Stripe pelo `provider_subscription_id` armazenado no servidor.
2. Confirma no Stripe que a assinatura pertence ao usuário autenticado.
3. Se já estiver agendada, retorna o mesmo estado sem gerar uma segunda alteração.
4. Caso contrário, define `cancel_at_period_end: true` com chave de idempotência.
5. Mantém o papel e o acesso premium até `current_period_end`.
6. Registra sucesso ou falha em `ua_audit_events`, sem guardar payloads ou segredos do Stripe.
7. O webhook `customer.subscription.updated` confirma o estado no banco local.
8. Enquanto a assinatura estiver ativa, o usuário pode desistir; o backend define `cancel_at_period_end: false` e aguarda a confirmação do mesmo webhook.

O frontend nunca decide o acesso. O backend considera o estado persistido da assinatura e o término do período.

## Eventos utilizados

- `checkout.session.completed`: associação inicial da assinatura.
- `customer.subscription.created`: criação e estado inicial.
- `customer.subscription.updated`: agendamento ou desistência do cancelamento, renovação e alterações de status.
- `customer.subscription.deleted`: encerramento efetivo.
- `invoice.payment_succeeded`: sincronização após pagamento.
- `invoice.payment_failed`: sincronização de inadimplência.

Cada evento é reservado por `event.id` em `ua_stripe_webhook_events`. Repetições concluídas
retornam como duplicadas sem nova escrita; tentativas que falharam podem ser retomadas. A assinatura
guarda a data e o identificador do último evento aplicado, impedindo que um evento estritamente mais
antigo reverta o estado local. Para eventos de assinatura e fatura, o backend consulta novamente o
estado atual no Stripe antes de persistir.

## Estados possíveis

- `active` ou `trialing`, sem cancelamento: acesso ativo e renovação normal.
- `active` ou `trialing`, com `cancel_at_period_end`: acesso ativo até a data final, sem renovação.
- `past_due` ou `unpaid`: estado de cobrança pendente; acesso definido pelo evento confirmado no backend.
- `canceled`: assinatura encerrada e acesso premium removido pelo webhook.
- `incomplete`, `incomplete_expired` ou `paused`: sem confirmação de assinatura ativa.
- `none`: nenhuma assinatura localizada.

## Rollback

- Código: reverter apenas o commit de cancelamento desta branch.
- Banco: as colunas novas são opcionais e compatíveis com a versão anterior. A tabela de auditoria pode permanecer sem afetar o fluxo antigo; se for necessário removê-la, exportar os eventos e só então executar `DROP TABLE` em uma mudança separada e autorizada.
- Stripe: uma assinatura apenas agendada pode ser reativada definindo `cancel_at_period_end: false` antes de `current_period_end`. Não há cancelamento imediato nem reembolso automático neste fluxo.

## Limites de teste

Os testes automatizados usam objetos Stripe simulados. Nenhuma assinatura real é alterada durante a validação da branch.
