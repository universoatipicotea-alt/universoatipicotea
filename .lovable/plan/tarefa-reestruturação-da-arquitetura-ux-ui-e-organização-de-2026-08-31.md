TAREFA: REESTRUTURAÇÃO DA ARQUITETURA, UX/UI E ORGANIZAÇÃO DE CONTEÚDO DO UNIVERSO ATÍPICO

IMPORTANTE:

NESTA TAREFA NÃO MEXER EM STRIPE.

NÃO MEXER EM CHECKOUT.

NÃO MEXER EM PAGAMENTOS.

NÃO MEXER EM WEBHOOK.

NÃO MEXER NA INTEGRAÇÃO FINANCEIRA EXISTENTE.

Essa etapa é EXCLUSIVAMENTE para:

- arquitetura da plataforma;

- organização das áreas;

- navegação;

- UX/UI;

- organização dos conteúdos;

- experiência do usuário;

- experiência administrativa;

- uploads;

- progresso de leitura;

- responsividade;

- Preview.

O sistema já existe.

NÃO quero reconstruir tudo do zero.

Primeiro audite o que existe e REAPROVEITE componentes, banco, Storage, rotas e funcionalidades funcionais.

==================================================

1. OBJETIVO PRINCIPAL

==================================================

Quero transformar o Universo Atípico em uma plataforma organizada, intuitiva e pronta para uso real.

Hoje existem funcionalidades e estruturas criadas em momentos diferentes do projeto.

Quero consolidar tudo em uma arquitetura única.

O usuário deve entrar na plataforma e entender rapidamente:

1. onde está;

2. o que pode fazer;

3. onde encontrar cada tipo de conteúdo;

4. o que começou a consumir;

5. como continuar de onde parou.

Não quero aparência de sistema em desenvolvimento.

Quero aparência de produto final.

==================================================

2. ARQUITETURA PRINCIPAL

==================================================

A navegação definitiva será:

INÍCIO

RECEITAS

ACADEMIA ATÍPICA

BIBLIOTECA

COMUNIDADE

FACILITADORES

-------------------

MINHA ASSINATURA

AJUDA E SEGURANÇA

MEU PERFIL

Essa estrutura deve ser igual e consistente em toda a plataforma.

==================================================

3. REMOVER "JORNADAS"

==================================================

O nome:

JORNADAS

deixa de existir na experiência do usuário.

Substituir por:

ACADEMIA ATÍPICA

IMPORTANTE:

Não quero apenas trocar o texto “Jornadas” por “Academia Atípica”.

Quero reorganizar o conceito e a página.

Antes de alterar:

identifique conteúdos, rotas, componentes e dados atualmente associados a Jornadas.

Preserve os conteúdos reais.

Apenas reorganize a experiência.

==================================================

4. FUNÇÃO DE CADA ÁREA

==================================================

Cada área precisa ter uma função muito clara.

-------------------

INÍCIO

-------------------

É o painel pessoal do usuário.

Deve responder:

“O que existe de novo?”

“O que posso explorar?”

“Onde parei?”

-------------------

RECEITAS

-------------------

Somente:

ALIMENTAÇÃO

RECEITAS

PREPAROS

Não misturar guias gerais da rotina.

-------------------

ACADEMIA ATÍPICA

-------------------

Conteúdos estruturados para aprender e avançar.

Pode conter:

- guias;

- trilhas;

- percursos;

- vídeos;

- materiais;

- conteúdos organizados por tema;

- etapas.

-------------------

BIBLIOTECA

-------------------

É a biblioteca pessoal do usuário.

Ela deve guardar e organizar aquilo que ele:

- começou a ler;

- salvou;

- concluiu;

- acessou recentemente.

-------------------

COMUNIDADE

-------------------

Espaço de interação real entre membros.

-------------------

FACILITADORES

-------------------

Área de produtos.

Nesta tarefa, organize somente arquitetura, navegação e experiência visual dessa área.

NÃO alterar pagamentos nesta etapa.

==================================================

5. HOME / INÍCIO

==================================================

Reestruture completamente a Home.

Não quero uma página cheia de cards sem hierarquia.

A Home deve funcionar como um painel pessoal.

TOPO:

“Olá, {nome}.”

Subtexto:

“Continue explorando o seu Universo.”

Depois:

-------------------

CONTINUE DE ONDE PAROU

-------------------

Se houver conteúdo iniciado:

mostrar:

- capa;

- título;

- categoria;

- progresso;

- botão “Continuar”.

Não mostrar progresso fictício.

Se não houver:

usar outra seção útil.

-------------------

EM DESTAQUE

-------------------

Mostrar conteúdos reais.

Usar os 6 PDFs já publicados quando apropriado.

Máximo de 3 cards inicialmente.

Botão:

“Ver todos”

-------------------

RECEITAS

-------------------

Mostrar uma pequena seleção de receitas reais.

Máximo de 3 ou 4.

CTA:

“Ver todas”

-------------------

ACADEMIA ATÍPICA

-------------------

Mostrar conteúdos/trilhas disponíveis.

CTA:

“Explorar Academia”

-------------------

VÍDEOS

-------------------

Preparar seção para conteúdos em vídeo.

Somente mostrar vídeos reais cadastrados.

Não criar vídeos fictícios.

-------------------

PERGUNTAS FREQUENTES

-------------------

Criar FAQ em accordion.

Design discreto e elegante.

==================================================

6. NÃO SOBRECARREGAR A HOME

==================================================

A Home deve mostrar caminhos.

Não deve mostrar todo o conteúdo existente.

Usar:

preview

→ CTA

→ página específica.

Exemplo:

3 guias

→ Ver todos

3 receitas

→ Ver todas

alguns conteúdos da Academia

→ Explorar Academia

Isso mantém a Home leve.

==================================================

7. RECEITAS

==================================================

Criar uma experiência própria para Receitas.

Página:

RECEITAS

Cabeçalho:

“Receitas possíveis para a rotina real.”

Criar:

- busca;

- categorias;

- filtros;

- cards;

- favoritos/salvos, se a estrutura atual suportar;

- estado vazio;

- loading.

Categorias existentes podem ser reaproveitadas.

Exemplo:

Todas

Café da manhã

Almoço

Lanche

Jantar

Doces

Bebidas

Rápidas

Cada card:

- capa;

- título;

- categoria;

- tempo de preparo, quando houver;

- resumo curto;

- CTA.

Ao abrir:

mostrar a receita de forma confortável para leitura.

==================================================

8. ADMIN → RECEITAS

==================================================

Receitas precisam ter cadastro próprio no Admin.

Não devem ser cadastradas dentro de Facilitadores.

Criar:

ADMINISTRAÇÃO

→ RECEITAS

Antes de criar estrutura nova:

verificar onde os dados atuais de Receitas estão armazenados.

Reaproveitar quando possível.

Formulário:

Título

Categoria

Descrição

Imagem de capa

Tempo de preparo

Ingredientes

Modo de preparo

PDF, quando aplicável

Destaque

Ordem

Status

Ações:

Salvar rascunho

Publicar

Editar

Arquivar

Excluir

Visualizar

==================================================

9. ACADEMIA ATÍPICA

==================================================

Quero uma experiência mais rica do que a antiga página Jornadas.

A Academia deve transmitir:

APRENDER

→ AVANÇAR

→ CONTINUAR

Criar cabeçalho elegante:

“Academia Atípica”

Subtexto curto explicando que ali estão conteúdos organizados para explorar no próprio ritmo.

Organizar por:

- trilhas;

- temas;

- guias;

- conteúdos;

- etapas.

Cards devem mostrar:

- capa;

- título;

- descrição;

- categoria;

- progresso quando iniciado;

- CTA.

Exemplos:

“Começar”

“Continuar”

“Revisitar”

Não inventar progresso.

==================================================

10. BIBLIOTECA = MEMÓRIA DO USUÁRIO

==================================================

Essa mudança é importante.

A Biblioteca NÃO deve ser apenas outra página contendo todos os PDFs.

Ela deve ser:

A BIBLIOTECA PESSOAL DO USUÁRIO.

Quando o usuário abrir um material compatível:

registrar automaticamente.

Criar seções:

CONTINUE LENDO

SALVOS

CONCLUÍDOS

RECENTES

Cada item:

- capa;

- título;

- origem;

- progresso;

- última leitura;

- CTA.

Exemplo:

“Continuar da página 8”

==================================================

11. PROGRESSO DE LEITURA

==================================================

Salvar progresso REAL.

Quando o usuário abrir um PDF:

registrar:

- conteúdo;

- usuário;

- página;

- percentual;

- última atividade.

Quando voltar:

continuar da última posição.

Não depender somente de localStorage.

O progresso deve funcionar entre dispositivos quando a arquitetura atual permitir persistência no backend.

==================================================

12. LEITOR DE PDF

==================================================

Melhorar o leitor existente.

Principalmente MOBILE.

Quero:

- PDF nítido;

- ajuste à largura;

- boa resolução;

- devicePixelRatio adequado;

- scroll suave;

- zoom;

- carregamento;

- mensagem de erro amigável;

- navegação simples;

- progresso automático.

Testar utilizando os PDFs reais já existentes.

==================================================

13. COMUNIDADE

==================================================

A Comunidade precisa parecer uma comunidade REAL.

Não apenas uma lista de posts.

Usuário deve conseguir:

- publicar;

- comentar;

- responder;

- reagir;

- editar o próprio post;

- excluir o próprio post;

- abrir perfil;

- acompanhar conversas.

Criar UX semelhante a um feed moderno, porém mais limpa e acolhedora.

Não copiar visualmente redes sociais.

Criar identidade própria do Universo Atípico.

==================================================

14. COMUNIDADE — UX

==================================================

Estrutura sugerida:

COMUNIDADE

[ Criar publicação ]

Feed

Conversas recentes

Minhas publicações

Cada publicação:

avatar

nome

data

conteúdo

imagem opcional

reações

comentários

Comentários devem permitir respostas.

No mobile:

priorizar leitura e interação.

Não criar usuários falsos.

Não criar posts falsos.

Estado vazio:

usar mensagem convidativa e elegante.

==================================================

15. FACILITADORES

==================================================

Nesta etapa, trabalhar apenas:

- arquitetura;

- UX/UI;

- catálogo;

- organização;

- página de produto.

NÃO alterar Stripe.

Página Facilitadores:

- destaques;

- busca;

- categorias;

- filtros;

- ordenação;

- cards.

Card:

imagem

nome

categoria

preço

resumo

“Ver produto”

Página individual:

imagem/capa

galeria

nome

descrição

preço

categoria

informações

CTA existente.

==================================================

16. ADMINISTRAÇÃO

==================================================

Quero melhorar 100% a experiência do Admin.

A Administração deve ser a CENTRAL DE CONTEÚDO.

Estrutura:

PAINEL

RECEITAS

ACADEMIA ATÍPICA

VÍDEOS

COMUNIDADE

FACILITADORES / PRODUTOS

FAQ

Não misturar essas áreas.

==================================================

17. ADMIN — PADRÃO DE LISTAGEM

==================================================

Todas as áreas administrativas devem seguir o mesmo padrão.

Topo:

Título

Descrição

Botão “Novo”

Depois:

Busca

Filtros

Status

Tabela/listagem.

Cada item:

- capa;

- nome;

- categoria;

- status;

- última atualização;

- ações.

Ações:

Visualizar

Editar

Duplicar, quando apropriado

Publicar

Arquivar

Excluir

==================================================

18. ADMIN — PADRÃO DE FORMULÁRIO

==================================================

Quero parar de ter formulários confusos.

Organizar formulários em blocos.

Exemplo:

INFORMAÇÕES PRINCIPAIS

MÍDIA

CONTEÚDO

ORGANIZAÇÃO

PUBLICAÇÃO

Não colocar 20 campos visualmente iguais em uma única coluna sem hierarquia.

==================================================

19. UPLOAD

==================================================

Melhorar completamente o upload.

Não quero campo pedindo URL manual de imagem quando o administrador pode fazer upload.

Criar componente de upload com:

- arrastar e soltar;

- selecionar arquivo;

- preview;

- progresso;

- substituir;

- remover;

- validação;

- erro;

- sucesso.

Para imagens:

mostrar preview real.

Para PDF:

mostrar:

nome

tamanho

status

visualizar

substituir

remover.

Usar o Storage existente.

Não criar Storage paralelo sem necessidade.

==================================================

20. ADMIN MASTER

==================================================

Não quero duplicação entre:

ADMINISTRAÇÃO

e

ADMIN MASTER.

ADMINISTRAÇÃO:

conteúdo.

ADMIN MASTER:

gestão global do sistema.

Nesta etapa, apenas reorganize a arquitetura e navegação do Admin Master.

Remover da interface:

- configurações antigas sem uso;

- itens de teste;

- páginas duplicadas;

- referências ao modelo antigo gratuito;

- menus que não fazem mais sentido.

IMPORTANTE:

não apagar dados reais.

==================================================

21. PRODUTO TESTE

==================================================

Remover da experiência:

“Produto teste”

e qualquer outro item claramente criado para teste.

Se houver registro no banco:

arquivar.

Não precisa excluir permanentemente.

Não mostrar para usuários.

==================================================

22. DESIGN SYSTEM

==================================================

Quero consistência em TODA a plataforma.

Padronizar:

- sidebar;

- header;

- títulos;

- subtítulos;

- cards;

- botões;

- inputs;

- filtros;

- busca;

- badges;

- modais;

- dropdowns;

- accordions;

- loaders;

- estados vazios;

- mensagens de erro;

- mensagens de sucesso;

- tabelas;

- formulários.

Não quero cada página parecendo um sistema diferente.

==================================================

23. IDENTIDADE VISUAL

==================================================

Preservar a identidade do Universo Atípico.

Visual:

- premium;

- humano;

- contemporâneo;

- acolhedor;

- clean;

- elegante.

Evitar:

- excesso de cards;

- excesso de bordas;

- excesso de cores;

- sombras pesadas;

- aparência infantil;

- aparência hospitalar;

- interface genérica de dashboard SaaS.

Priorizar clareza e hierarquia visual.

==================================================

24. RESPONSIVIDADE

==================================================

Revisar todas as áreas em:

DESKTOP

TABLET

MOBILE

Principalmente:

Home

Receitas

Academia

Biblioteca

Comunidade

Facilitadores

PDF Reader

Admin

No mobile:

- não deixar sidebar ocupar a tela;

- evitar textos pequenos;

- evitar botões apertados;

- evitar overflow horizontal;

- garantir áreas de toque confortáveis;

- manter hierarquia.

==================================================

25. NÃO INVENTAR DADOS

==================================================

Não criar:

- usuários fictícios;

- comentários fictícios;

- avaliações fictícias;

- progresso fictício;

- receitas fictícias;

- PDFs fictícios;

- vídeos fictícios;

- métricas fictícias;

- “mais populares” sem dados;

- “trending” sem dados.

Use conteúdo real existente.

Quando não houver conteúdo:

estado vazio elegante.

==================================================

26. REAPROVEITAMENTO

==================================================

Antes de criar qualquer coisa nova:

PROCURE O QUE JÁ EXISTE.

Se já existe uma tabela funcional:

reaproveite.

Se já existe upload:

melhore.

Se já existe leitor:

corrija.

Se já existe página:

refatore.

Se já existe componente:

padronize.

Evite duplicação técnica.

==================================================

27. ORDEM DE EXECUÇÃO

==================================================

FAÇA NESTA ORDEM:

1. Auditoria da arquitetura atual.

2. Mapear:

- páginas;

- rotas;

- banco;

- Storage;

- componentes;

- Admin;

- conteúdos reais.

3. Definir o que será:

- mantido;

- movido;

- renomeado;

- arquivado;

- refatorado.

4. Implementar navegação principal.

5. Reestruturar Home.

6. Reestruturar Receitas.

7. Transformar Jornadas em Academia Atípica.

8. Reestruturar Biblioteca e progresso.

9. Melhorar Comunidade.

10. Organizar Facilitadores visualmente.

11. Reestruturar Administração.

12. Melhorar uploads.

13. Padronizar UX/UI.

14. Revisar mobile.

==================================================

28. NÃO MEXER NESTA ETAPA

==================================================

NÃO alterar:

- Stripe;

- checkout;

- pagamento;

- webhook;

- credenciais;

- plano;

- cobrança;

- assinatura;

- integração financeira existente.

Esses assuntos pertencem a outra tarefa.

==================================================

29. PREVIEW OBRIGATÓRIO

==================================================

IMPORTANTE:

Depois de implementar essa arquitetura:

ABRA O PROJETO EM PREVIEW.

Não encerre a tarefa apenas com relatório técnico.

Quero VER a nova experiência.

No Preview, deixe disponível para validação:

1. Home

2. Receitas

3. Academia Atípica

4. Biblioteca

5. Comunidade

6. Facilitadores

7. página de produto

8. Administração

9. formulário de Receitas

10. formulário da Academia

11. formulário de Facilitadores

12. upload de imagem/PDF

Quero validar visualmente antes da próxima rodada.

==================================================

30. CRITÉRIO DE SUCESSO

==================================================

Ao terminar, a plataforma deve transmitir:

“Cada coisa está no lugar certo.”

O usuário deve conseguir entender a arquitetura sem precisar de explicação.

INÍCIO

→ descobrir e continuar.

RECEITAS

→ alimentação.

ACADEMIA ATÍPICA

→ aprender e percorrer conteúdos estruturados.

BIBLIOTECA

→ guardar e continuar o que estou consumindo.

COMUNIDADE

→ conversar e interagir.

FACILITADORES

→ descobrir produtos.

ADMIN

→ criar e organizar todo esse conteúdo.

Não quero apenas uma mudança estética.

Quero uma arquitetura de produto coerente, funcional e pronta para crescer.

IMPLEMENTE E ABRA EM PREVIEW PARA MINHA VALIDAÇÃO.