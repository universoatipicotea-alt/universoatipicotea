# Novo funil: Landing única → VSL → Checkout

## O que muda

Hoje existem duas landing pages (`/` e `/academia-atipica`) com propostas parecidas. O funil passa a ser um só caminho:

```text
/ (landing única)  →  [Quero fazer parte da comunidade]  →  /vsl (headline + vídeo)
      →  (vídeo assistido até o fim libera o botão)  →  checkout (link externo) + criar conta
      →  /entrar continua igual para quem já tem conta
```

## 1. Landing principal (`/`)

- Mantida a home atual (interface melhor e mais completa) e removida a `/academia-atipica`; `/academia-atipica` passa a redirecionar para `/`, para não quebrar links já divulgados.
- O texto passa a explicar a comunidade como acesso pago (R$ 49,90), sem prometer "comunidade gratuita".
- Um único CTA em toda a página: **"Quero fazer parte da comunidade"**, apontando para `/vsl`. Os outros botões e links de conversão (Biblioteca gratuita, Acessar comunidade, Começar agora, prateleira de produtos) saem, para concentrar todo o tráfego nesse botão.
- No topo permanece apenas um link discreto **Entrar**, para quem já é membro.

## 2. Página de VSL (`/vsl`)

- Headline configurável (padrão: "Alimentação com mais possibilidades, sem pressão") e subtítulo curto.
- Player de vídeo abaixo, sem controle de avanço (não dá para pular).
- O botão de compra fica oculto até o vídeo terminar; ao terminar, aparece com animação junto a um bloco curto de benefícios e do preço.
- Quem recarrega a página depois de já ter assistido continua vendo o botão liberado (registro local no navegador).

## 3. Botão final → conta + pagamento

- O botão leva ao fluxo de conclusão: a pessoa cria a conta (nome, e-mail, senha) e em seguida é enviada ao **link externo de pagamento** configurado no Master.
- A tela atual de `/checkout` é reescrita para esse fluxo (criar conta + ir para o pagamento), sem os passos fictícios de hoje.
- Quem já tem conta usa `/entrar` normalmente — nada muda nesse caminho, inclusive para sua conta Master.

## 4. Painel Master — nova aba "Funil / VSL"

Campos administrados por você:
- **Upload do vídeo (MP4)** para o armazenamento do projeto, com substituição do vídeo atual.
- **Headline** e **subtítulo** da VSL.
- **Texto do botão** de compra.
- **Link externo de pagamento** (Hotmart/Kiwify/Stripe etc.).
- **Preço exibido** (padrão R$ 49,90).

## Detalhes técnicos

- Nova tabela `ua_funnel_settings` (linha única) com: `vsl_video_path`, `headline`, `subheadline`, `cta_label`, `checkout_url`, `price_label`, `updated_at`. RLS: leitura pública dos campos públicos; escrita apenas para `master`/`admin`, com GRANTs correspondentes.
- Novo bucket privado `funil-video` (limite ~200MB). O vídeo é servido por uma rota pública de streaming (`/api/public/ua-video/$`) que gera URL assinada, seguindo o padrão já usado em `ua-image`.
- Novos handlers em `community.server.ts`: `funnel.get` (público) e `funnel.update` (staff), expostos pelo shim tRPC existente.
- Novos arquivos: `src/pages/Vsl.tsx`, `src/routes/vsl.tsx` (com `head()` próprio), painel de funil dentro de `src/pages/Master.tsx`.
- Removidos: `src/pages/AcademiaLanding.tsx` e a rota atual `/academia-atipica` (substituída por redirect).
- Liberação do botão via evento `ended` do `<video>` + flag em `localStorage`.

## Fora do escopo

Cobrança integrada (Stripe/Paddle) e liberação automática de acesso após o pagamento não entram agora — o pagamento acontece no link externo. Quando quiser, ligamos a cobrança nativa e a liberação automática.
