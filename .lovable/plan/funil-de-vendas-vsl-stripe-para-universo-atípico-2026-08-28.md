# Funil de vendas VSL + Stripe para Universo Atípico

## Contexto

O usuário escolheu a direção visual **Premium funnel hero** para a landing page e quer o pagamento integrado ao Stripe nativo da Lovable, com liberação automática de acesso após o pagamento.

**Bloqueio atual:** o workspace não está em um plano pago, então o Stripe nativo não pôde ser ativado. A recomendação é fazer o upgrade pelo link de billing. Enquanto o upgrade não acontece, construímos toda a estrutura do funil e deixamos os ganchos do Stripe prontos.

## Escopo

1. **Landing page `/` reformulada**
   - Hero com headline focada na comunidade paga, subtítulo e CTA único "Quero fazer parte da comunidade" → `/vsl`.
   - Faixa de métricas reais (vindas do backend, sem inventar números).
   - Bloco curto de benefícios/trilhas.
   - Preço e CTA final.
   - Header simplificado com link "Entrar".
   - Remover seções que distraem do funil (prateleira de produtos externos, múltiplos CTAs).
   - Adaptar a direção "Premium funnel hero" às cores acolhedoras do Universo Atípico (papel, tinta, azul-marinho, verde-sálvia, dourado).

2. **Página VSL `/vsl`**
   - Headline e subtítulo configuráveis.
   - Player de vídeo sem controle de avanço.
   - Botão de compra oculto até o vídeo terminar; ao terminar, exibe com animação.
   - Persistência local (`localStorage`) para quem já assistiu.
   - CTA leva para `/checkout`.

3. **Checkout `/checkout` reformulado**
   - Fluxo: criar conta (nome, e-mail, senha) → pagamento Stripe.
   - Para quem já tem conta: `/entrar` com redirecionamento para o checkout.
   - Integração com Stripe nativo (ativada após upgrade).
   - No Brasil: usar `automatic_tax: { enabled: true }` (cálculo e cobrança de impostos; sem `managed_payments`).

4. **Regras de acesso pós-pagamento**
   - Nova tabela `subscriptions` (ou reutilizar estrutura de assinatura existente) com: `user_id`, `status`, `provider`, `provider_subscription_id`, `current_period_end`, `created_at`, `updated_at`.
   - RLS: usuário vê apenas sua própria assinatura; staff/admin vê todas.
   - Função `has_active_subscription(user_id)` para verificar acesso.
   - Proteger rotas/conteúdo pagos (comunidade paga, Academia, PDFs premium) por essa função.
   - Webhook Stripe (`/api/public/stripe`) para atualizar status após pagamento.

5. **Backend**
   - Tabela `ua_funnel_settings` (linha única): `vsl_video_path`, `headline`, `subheadline`, `cta_label`, `checkout_url`, `price_label`, `updated_at`.
   - Bucket privado `funil-video` (~200 MB).
   - Rota pública de streaming `/api/public/ua-video/$` (URL assinada).
   - Handlers tRPC: `funnel.get` (público) e `funnel.update` (staff/master).

6. **Painel Master**
   - Nova aba "Funil / VSL" com upload de vídeo, edição de headline, subtítulo, CTA, preço e link de checkout (este último pode ser sobrescrito pelo Stripe quando ativo).

7. **Redirecionamentos**
   - `/academia-atipica` → `/` (preservando links antigos).

## Dependências externas

- Upgrade do workspace para plano pago.
- Ativação do Stripe nativo (`payments--enable_stripe_payments`).
- Criação de produto/preço no Stripe após ativação.

## Ordem de implementação

1. Banco: `ua_funnel_settings`, bucket `funil-video`, rota de streaming, GRANTs/RLS.
2. Landing page `/` reformulada.
3. Página VSL `/vsl` + rota.
4. Checkout `/checkout` reformulado (conta + placeholder Stripe).
5. Tabela de assinaturas + função `has_active_subscription` + RLS.
6. Webhook Stripe (`/api/public/stripe`) e regras de acesso.
7. Painel Master "Funil / VSL".
8. Redirecionamento `/academia-atipica` → `/`.
9. Build e testes.

## Fora do escopo inicial

- Integração com Paddle.
- Cobrança recorrente complexa (mensal/anual) — começamos com acesso pago único ou assinatura simples.
- Migração de dados antigos de assinatura.
