# Rastreador: variação de página para revisão

## Acesso e escopo

Variação proposta: `/lojamundoazul/produto/rastreador-inteligente-infantil?layout=landing`.
Sem `layout=landing`, a apresentação atual continua disponível. O parâmetro só afeta esse produto.
Não há divisão automática de tráfego, novas integrações de analytics, publicação ou alteração de preço no banco.

A implementação usa `src/pages/Storefront.tsx`, compartilhado com a loja, e mantém a consulta do produto,
o preço calculado, as variações, a quantidade, os links e as operações do carrinho existentes na branch base.
A rota permanece em `src/routes/lojamundoazul_.produto_.$slug.tsx`.

## Galeria e investigação da área vazia

Em 22/10/2026, a imagem principal e as três miniaturas adicionais da página publicada carregaram com
dimensões naturais positivas. Não foi reproduzida uma URL permanentemente quebrada. A versão original
do componente não tinha recuperação de erro; o índice da imagem também sobrevivia a trocas de slug.

`ProductGallery.tsx` remove espaços e duplicatas, tenta a próxima imagem cadastrada quando uma falha,
mantém a imagem dentro de um quadro de tamanho definido e oferece um estado explícito com nova tentativa
se nenhuma foto carregar. A seleção é reiniciada por produto. Ampliação e miniaturas têm controles acessíveis.
Esses ajustes não comprovam nem corrigem uma eventual indisponibilidade do serviço que entrega os arquivos.

Na variação, duas montagens existentes que representam mapas/localização infantil foram excluídas por
suas chaves conhecidas, pois o funcionamento retratado não foi comprovado. As outras imagens continuam
vindo do cadastro; não foram substituídas por imagens geradas. A imagem principal publicada é uma montagem,
portanto as imagens restantes também precisam da confirmação visual do vendedor antes de serem descritas
como fotografias reais do modelo vendido.

## Materiais e especificações pendentes

A pasta do Drive foi listada nas sete subpastas AV 01–07. Ela contém os sete DOCX de relatos e oito AVIF
(há dois AVIF em AV 02). Os oito AVIF foram baixados e inspecionados: são fotos de tags/embalagens, não
capturas dos relatos. Mostram modelos quadrados, diferentes do modelo arredondado na vitrine.
Algumas embalagens mostram Apple Find My; isso não confirma que a tag vendida pela loja seja esse modelo.
As fotos não foram incorporadas como provas visuais do produto.

Os sete relatos fornecidos pelo usuário aparecem integralmente em cartões com nomes. Não há estrelas,
média, quantidade de vendas, compra verificada, selos ou resultados acrescentados.

Antes de publicar, confirmar com documentação do modelo vendido:

- Modelo exato e correspondência entre catálogo, produto entregue e materiais de avaliação.
- Bluetooth/GPS, aplicativo, sistemas e versões de celulares compatíveis.
- Alcance, dependências de rede/aparelhos próximos e limitações de localização.
- Tipo, troca e duração da bateria; acessórios incluídos e fixação.

O código do repositório não contém essas especificações. A variação apresenta uso em objetos,
explicita as lacunas nas dúvidas frequentes e não promete proteção de crianças, supervisão,
monitoramento ao vivo ou localização garantida. Não há evidência suficiente para ensinar pareamento específico.

## Vídeo e imagem contextual

Nenhum MP4/WebM real do produto foi encontrado no repositório. O componente espera
`public/videos/rastreador-demonstracao.mp4`; só monta o player após resposta bem-sucedida com
Content-Type de vídeo e volta ao estado sem player se o carregamento falhar.
Um HTML de fallback da SPA não ativa o player. Não há autoplay ou animação substituindo demonstração real.

Para preparar o material: filmar aproximadamente 20–30 segundos com o modelo confirmado de perto,
fixação em um objeto e funcionamento real. Pareamento apenas depois de confirmado no manual.
Não simular mapas ou telas. O componente aceita `poster` para uma foto real aprovada.
Não foi definido um poster usando as fotos divergentes.

O arquivo contextual informado em `/workspace/scratch/7aa4581a4228/generated_images/exec-a83585a1-90ea-486b-ae79-e1bcf74080d0.png`
não está disponível neste ambiente Windows. Ele não foi substituído nem usado como foto da tag.

## Checkout publicado: divergência da fonte

A página em produção usa `store.checkout`, um botão com abertura de pagamento, tracking de
InitiateCheckout e suporte a `checkoutMode=ironpay`. Esses trechos não existem na branch `main`
do GitHub, cuja base local é `3c14058`. A branch foi novamente consultada durante o trabalho.

Esta proposta não reconstitui nem substitui a integração ausente. Os links e o carrinho presentes
na base foram preservados; a integração real publicada ainda precisa ser sincronizada pelo projeto
Lovable/GitHub antes de portar e validar esta variação nessa versão. **Não integrar ou publicar
esta branch sobre a versão em produção antes dessa conciliação.**

## Validação e limites

- `npm run check`: aprovado.
- ESLint nos arquivos TS/TSX alterados: aprovado.
- `npm run build`: aprovado.
- `tests/store-mundo-azul.test.ts`: 5/5 aprovados.
- Suíte completa: 79/84 aprovados. As mesmas cinco falhas foram reproduzidas numa cópia limpa
  de HEAD: páginas de módulo/aulas, login e slots visuais. Não foram modificadas para mascarar o resultado.
- Prévia local usa os componentes reais com uma API de teste isolada, preços/cores e URLs de imagens
  observados na vitrine. Links de checkout são `example.com` na prévia. Não é um teste do pagamento em produção.
- Conferidos seleção Verde, quantidade 2, link específico da variação e inclusão no carrinho local.
- Conferidos fallback da primeira imagem, lista vazia, falha total e modal de ampliação.
- Conferidos desktop e composição responsiva em iframe de 390 px, incluindo o atalho fixo para a compra.

## Hipótese do teste

A variação muda a hierarquia visual, explicita usos cotidianos, aproxima os relatos da decisão e
mantém um acesso persistente à compra no celular. Trata-se de uma hipótese de conversão, não um resultado.
Depois de confirmar produto/checkout e autorizar a publicação, comparar tráfego de mesma origem e
oferta entre a URL atual e a variação. Separar acesso, escolha de variação, início de checkout e pagamento
confirmado; clique no botão não é venda. Não atribuir o resultado anterior somente ao layout sem esses dados.
