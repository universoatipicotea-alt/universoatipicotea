# Facilitadores como loja de produtos (Stripe só aqui)

## Organização definitiva

- **Receitas** — só receitas/alimentação (campo próprio no Admin).
- **Academia / Jornadas** — guias e trilhas da rotina.
- **Biblioteca** — guias e materiais.
- **Comunidade** — interação entre membros.
- **Facilitadores** — catálogo de produtos (físicos e afins) vendidos separadamente, com Stripe.

Nada de Receitas, Jornadas, Biblioteca, Comunidade, PDFs ou guias cria produto no Stripe. Auditoria confirma e remove qualquer ponto que faça isso.

A curadoria antiga de Facilitadores (itens só com link externo) e a aba "Produto teste" saem da área: os registros existentes são arquivados, sem apagar dados. O cadastro de receitas que hoje vive em Facilitadores passa a ficar na aba Receitas do Admin.

## Catálogo público

- `/facilitadores` vira vitrine pública (visitante e assinante veem igual): cards com imagem, nome, preço, categoria, resumo e "Ver produto".
- Busca, filtro por categoria, seção de destaques, ordenação (destaque, preço, mais recentes) e estado vazio elegante.
- `/produto/{slug}` vira página de produto profissional: capa + galeria, nome, descrição curta e completa, preço (com promocional riscado), categoria, disponibilidade/estoque, informações adicionais e botão COMPRAR.
- Compra como convidado: o e-mail é coletado no próprio Stripe. Se o usuário estiver logado, o e-mail vem preenchido e a compra fica vinculada à conta.
- A compra de produto é totalmente separada da assinatura de R$ 49,90/mês — carrinhos, tabelas e páginas de confirmação distintos.
- `/compra-confirmada?session_id=...` mostra o status real da compra (aprovado, pendente, cancelado).

## Administração (aba Facilitadores / Produtos)

Formulário completo: nome, slug, descrição curta, descrição completa, capa, galeria, categoria, tipo (físico/digital/link externo), preço, preço promocional, disponibilidade, estoque, SKU, destaque, ordem, rótulo do botão, informações adicionais e, quando for link externo, a URL.

Status: **Rascunho / Publicado / Arquivado** — só Publicado aparece no site. Ações: criar, editar, publicar, arquivar, excluir, ver no site, e ver o vínculo com Stripe.

**Upload de capa e galeria**: novo componente com arrastar-e-soltar, seleção manual, preview, substituir, remover, validação de tipo/tamanho e feedback de progresso. Upload real para o Storage (sem URL falsa).

## Stripe

Ao publicar um produto com preço, o sistema cria/vincula Stripe Product + Price e grava `stripe_product_id` e `stripe_price_id`. Se o preço mudar, cria um **novo Price** e desativa o anterior — compras antigas continuam válidas. Produto arquivado é desativado no Stripe, não excluído.

Cada compra gera um pedido no banco (pendente → pago / cancelado), atualizado pelo webhook já existente, em um ramo separado do ramo de assinatura.

## Admin Master

Painel somente de leitura para Facilitadores: Stripe Product ID, Price ID, status da sincronização, último sync, erros de integração, vendas e pagamentos. Sem duplicar o cadastro editorial.

## Detalhes técnicos

- Migração: estender `ua_products` (descrição longa, preços em centavos, moeda, tipo, disponibilidade, estoque, SKU, galeria jsonb, CTA, info extra, `stripe_product_id`, `stripe_price_id`, `stripe_sync_status`, `stripe_synced_at`, `stripe_error`), tornar `external_url` opcional e permitir status `archived`. Nova tabela `ua_product_orders` (produto, sessão Stripe, valor, moeda, status, e-mail, user_id) com GRANTs + RLS. Arquivar linhas de `ua_facilitators`.
- `src/lib/facilitators.server.ts`: sincronização Stripe (produto/preço), criação de checkout `mode: "payment"` com metadata `kind=facilitator_product`, e leitura de status da sessão.
- `src/lib/community.server.ts`: novas rotas tRPC públicas (`products.list`, `products.bySlug`, `products.checkout`, `products.order`) e admin (`admin.products.*`), reaproveitando o padrão de permissões atual.
- `src/routes/api/public/stripe-webhook.ts`: tratar `checkout.session.completed` / `expired` / `payment_failed` de produtos separadamente da assinatura.
- Frontend: `src/pages/Facilitators.tsx` reescrita como vitrine, nova `src/pages/Product.tsx` (substitui o redirect), `src/pages/CompraConfirmada.tsx`, novo `src/components/ImageDropzone.tsx`, aba Produtos em `src/pages/Admin.tsx`, aba Receitas movida para o Admin, painel Stripe em `src/pages/Master.tsx`.
- Chaves de teste: adiciono suporte a `STRIPE_SECRET_KEY_TEST` (e `STRIPE_WEBHOOK_SECRET_TEST`). Com a chave em modo teste, valido os 14 cenários com cartões de teste; sem ela, o fluxo real fica dependendo das credenciais.

## Testes de ponta a ponta

Criar produto → upload de capa → descrição → preço → publicar → aparece na vitrine → Product/Price corretos → Comprar abre checkout certo → pagamento aprovado confirma pedido → cancelado não confirma → troca de preço não quebra compra antiga → arquivado some → rascunho não aparece. Também confirmo que nenhum conteúdo de Receitas/Jornadas/Biblioteca/Comunidade cria produto no Stripe.
