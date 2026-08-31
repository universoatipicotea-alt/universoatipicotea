TAREFA: SEPARAR E MELHORAR AS DUAS HOMES DO UNIVERSO ATÍPICO

IMPORTANTE:

Hoje `/` e `/inicio` usam a mesma Home.

Isso precisa acabar.

Quero DUAS experiências diferentes:

1. HOME PÚBLICA

rota: `/`

2. HOME DO MEMBRO

rota: `/inicio`

Não existe “modo visitante” dentro da plataforma.

O visitante fica apenas na landing pública.

O membro autenticado entra na plataforma e vê `/inicio` como primeira página do sidebar.

NÃO mexer em Stripe, checkout, pagamento ou webhook nesta tarefa.

==================================================

1. HOME PÚBLICA `/`

==================================================

A rota `/` continua sendo a landing page de venda.

Objetivo:

apresentar o Universo Atípico

→ mostrar valor

→ gerar desejo

→ levar para assinatura.

Não usar a estrutura de painel de membro.

A Home pública deve ter:

HERO

- headline forte;

- subheadline;

- CTA principal;

- identidade visual atual;

- imagem humana e premium.

SEÇÃO DE VALOR

Mostrar de forma clara o que existe dentro do Universo Atípico:

- Receitas

- Academia Atípica

- Biblioteca

- Comunidade

- Facilitadores

SEÇÃO DE ACERVO REAL

Mostrar uma prévia visual do conteúdo já publicado.

Usar capas reais dos 6 PDFs existentes.

Separar visualmente:

GUIAS

→ usar os guias publicados.

RECEITAS

→ usar as receitas publicadas.

IMPORTANTE:

Na Home pública mostrar apenas:

- capa;

- título;

- categoria;

- resumo curto.

NÃO liberar PDF.

NÃO liberar conteúdo protegido.

NÃO mostrar progresso.

NÃO mostrar conteúdo completo.

CTA da seção:

“Conheça o Universo”

ou

“Quero fazer parte”

SEÇÃO “O QUE VOCÊ ENCONTRA”

Explicar rapidamente as áreas.

SEÇÃO DE ASSINATURA

Mostrar:

Universo Atípico

R$ 49,90/mês

CTA claro.

FAQ público:

- O que está incluído?

- Como funciona a assinatura?

- Posso cancelar?

- Como acesso os conteúdos?

- O conteúdo substitui orientação profissional?

Rodapé:

- Termos

- Privacidade

- Ajuda

- informações institucionais.

==================================================

2. HOME DO MEMBRO `/inicio`

==================================================

Essa é a primeira página que o usuário vê após entrar na plataforma.

Ela precisa parecer uma ÁREA PESSOAL.

Não deve parecer landing page.

Não deve vender novamente o produto para quem já está dentro.

Não usar hero comercial.

Não mostrar CTA de assinatura para usuário com acesso ativo.

Usar:

MemberShell

Sidebar atual.

No topo:

“Olá, {nome}.”

Subtexto:

“Continue explorando o seu Universo.”

==================================================

3. ORDEM DAS SEÇÕES EM `/inicio`

==================================================

SEÇÃO 1

CONTINUE DE ONDE PAROU

Só mostrar quando existir progresso REAL salvo.

Usar dados de:

ua_reading_progress

Mostrar:

- capa;

- título;

- categoria;

- percentual;

- página atual;

- CTA.

Exemplo:

“Continuar da página 8”

Não criar progresso fictício.

Se não houver progresso:

não renderizar essa seção.

==================================================

4. GUIAS EM DESTAQUE

==================================================

Mostrar até 3 guias publicados da Academia Atípica.

Existem 4 PDFs de guias publicados.

Usar esses conteúdos reais.

Card:

- capa;

- categoria;

- título;

- resumo;

- CTA.

CTA geral:

“Ver todos”

Destino:

Academia Atípica.

Não mostrar os 4 de uma vez na Home.

Máximo:

3.

==================================================

5. RECEITAS

==================================================

Mostrar até 3 receitas publicadas.

Existem 2 PDFs de receitas atualmente publicados.

Usar os 2 reais.

Não inventar terceira receita.

Card:

- capa;

- categoria;

- título;

- resumo;

- CTA.

CTA geral:

“Ver todas”

Destino:

Receitas.

==================================================

6. VÍDEOS

==================================================

Mostrar apenas vídeos destinados a membros.

Hoje existe um vídeo relacionado ao funil.

Não assumir automaticamente que ele é conteúdo da área de membros.

Auditar o cadastro.

Se não houver vídeo válido para membros:

mostrar estado vazio elegante.

Exemplo:

“Novos vídeos serão reunidos aqui quando estiverem disponíveis.”

Não inventar vídeo.

Não usar thumbnail fictícia.

==================================================

7. FAQ DO MEMBRO

==================================================

Criar bloco:

PERGUNTAS FREQUENTES

Usar accordion discreto.

Perguntas reais:

“O que está incluído no meu acesso?”

“Como encontro um material que comecei a ler?”

“Como funciona a Academia Atípica?”

“Como acesso meus PDFs?”

“Como funciona a assinatura de R$ 49,90/mês?”

“Como faço para cancelar?”

“Os conteúdos substituem acompanhamento profissional?”

Adicionar links quando necessário para:

Ajuda e segurança

Minha assinatura

Termos

Privacidade

==================================================

8. HOME DO MEMBRO NÃO É CATÁLOGO COMPLETO

==================================================

Não mostrar tudo na Home.

Ela é um painel de descoberta e continuidade.

Estrutura:

CONTINUAR

→ conteúdo em andamento.

DESCOBRIR

→ até 3 guias.

EXPLORAR

→ até 3 receitas.

ASSISTIR

→ vídeos reais.

TIRAR DÚVIDAS

→ FAQ.

Cada seção deve levar para sua área completa.

==================================================

9. DIFERENÇA VISUAL ENTRE AS DUAS HOMES

==================================================

HOME PÚBLICA `/`

Objetivo:

CONVERTER.

Pode ter:

- hero;

- imagem maior;

- argumentos de valor;

- preço;

- CTA;

- prévia do acervo.

HOME DO MEMBRO `/inicio`

Objetivo:

ORIENTAR E FAZER CONTINUAR.

Deve ter:

- saudação;

- continuidade;

- conteúdos;

- progresso;

- atalhos.

Não reutilizar o hero comercial da landing dentro do painel.

==================================================

10. DADOS

==================================================

Estender:

community.landing

para retornar apenas prévia pública dos conteúdos publicados.

Permitir somente:

- id;

- slug;

- capa;

- título;

- categoria;

- resumo curto.

NÃO retornar:

- PDF;

- URL protegida;

- conteúdo completo;

- progresso;

- dados privados.

==================================================

11. DASHBOARD DO MEMBRO

==================================================

Criar ou ajustar:

community.memberDashboard

Retornar:

- guias publicados;

- receitas publicadas;

- progresso real do usuário;

- vídeos para membros;

- dados necessários para a Home.

Reaproveitar:

ua_reading_progress

e estruturas existentes.

Não criar tabela nova se já houver fonte adequada.

==================================================

12. COMPONENTES

==================================================

Manter:

src/pages/Home.tsx

somente para a landing pública.

Criar:

src/pages/Inicio.tsx

para o painel do membro.

Usar em:

src/routes/inicio.tsx

Criar:

src/components/ContentCard.tsx

reutilizável.

O card deve aceitar:

- imagem;

- categoria;

- título;

- resumo;

- progresso opcional;

- CTA;

- destino.

Depois ele poderá ser reutilizado em:

Academia

Receitas

Biblioteca.

==================================================

13. MOBILE

==================================================

Na Home pública:

preservar leitura comercial confortável.

Na Home do membro:

não usar grids apertadas.

Para cards no mobile:

preferir carrossel horizontal com swipe.

Garantir:

- áreas de toque confortáveis;

- cards legíveis;

- sem overflow;

- textos sem corte;

- CTA acessível.

==================================================

14. ESTADOS VAZIOS

==================================================

Todo bloco deve ter comportamento real.

Sem conteúdo:

estado vazio.

Sem progresso:

não mostrar “Continue de onde parou”.

Sem vídeos:

estado vazio.

Sem receita:

estado vazio.

Nunca preencher para “ficar bonito”.

==================================================

15. DESIGN

==================================================

A experiência deve seguir:

clareza

→ organização

→ leveza

→ acolhimento.

Evitar:

- dashboards genéricos;

- excesso de cards;

- excesso de informações;

- muitas métricas;

- números sem utilidade;

- visual corporativo frio.

O usuário deve entender imediatamente:

“isso é para mim” e “o que posso fazer aqui”.

==================================================

16. FLUXO DO USUÁRIO

==================================================

VISITANTE:

entra em `/`

→ conhece a plataforma

→ vê prévia real

→ entende o que está incluído

→ encontra CTA.

MEMBRO:

entra

→ vai para `/inicio`

→ vê saudação

→ continua conteúdo

→ descobre guias

→ acessa receitas

→ vê vídeos

→ tira dúvidas.

Não criar terceira experiência de visitante dentro do sistema.

==================================================

17. PREVIEW

==================================================

Depois de implementar:

ABRA EM PREVIEW.

Quero validar:

1. `/` como landing pública;

2. `/inicio` como painel do membro;

3. diferença visual clara entre as duas;

4. Home pública com prévia real;

5. Home do membro com conteúdos reais;

6. Continue de onde parou;

7. Guias;

8. Receitas;

9. Vídeos;

10. FAQ;

11. mobile.

Não encerrar apenas com explicação técnica.

Quero ver as duas experiências funcionando no Preview.

==================================================

18. NÃO MEXER

==================================================

NÃO alterar:

- Stripe;

- checkout;

- pagamento;

- webhook;

- assinatura;

- cobrança;

- integração financeira.

Esta tarefa é somente:

HOME PÚBLICA

+

HOME DO MEMBRO

+

CONTEÚDO REAL

+

UX/UI.

&nbsp;

&nbsp;