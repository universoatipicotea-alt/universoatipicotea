# Roadmap — Universo Atípico

## Em andamento
- [ ] Refatoração completa de UI/UX (fonte de design: Gestão → Administração → Receitas)

### Refatoração tela por tela
- [ ] Design system (`src/components/ds.tsx`): tokens, tipografia, grid, sidebar, header interno
- [ ] Início (`/inicio`)
- [ ] Receitas (`/receitas`)
- [ ] Academia Atípica (`/academia`)
- [ ] Biblioteca (`/biblioteca`)
- [ ] Comunidade (`/comunidade`) — feed + modal de conversa
- [ ] Facilitadores (`/facilitadores`)
- [ ] Minha assinatura (`/minha-assinatura`) e Meu perfil (`/perfil`)
- [ ] Ajuda (`/ajuda`)
- [ ] Administração (`/admin`) e Admin Master (`/master`)
- [ ] Mobile: drawer, alvos de 44px, sem overflow
- [ ] Limpeza de legado visual e componentes duplicados

### Facilitadores como loja
- [ ] Produtos reais de Facilitadores com preço e checkout Stripe (produto → Comprar → Stripe → confirmação)
- [ ] Admin → Vendas de Facilitadores: compras confirmadas, valor total e histórico por produto
- [ ] Publicar produtos reais e testar o fluxo completo de compra

## Próximas
- [ ] Facilitadores como catálogo de produtos + Admin de produtos
- [ ] Melhorar Comunidade (respostas, reações)

## Concluído
- [x] Funil VSL + checkout Stripe + página /obrigado (rota criada e validada)
- [x] 6 PDFs e capas publicados
- [x] Capas de PDF: thumbnail da página 1, cards verticais sem distorção, regeneração
- [x] Academia Atípica reestruturada (progresso real, busca e filtros)
- [x] Landing pública `/` + `/entrar` só login + recuperação de senha
- [x] Cadastro público bloqueado no app e no backend de autenticação
- [x] Fluxo ponta a ponta validado: checkout → pagamento → ativação → `/inicio` → login

## Auditoria SaaS e Admin Master (escopo ampliado)

O Google Drive será apenas uma fonte opcional de importação e organização. O cadastro manual no Admin e no Admin Master continuará independente e prioritário.

### Checkpoint 1 — Estrutura editorial
- [x] Rotas dinâmicas de categorias de Receitas e módulos da Academia
- [x] Hub da Academia baseado nos módulos cadastrados
- [x] Categorias e módulos com nome, slug, capa, descrição, ordem e status
- [x] Gestão manual de categorias e módulos no Admin e no Admin Master
- [x] Conteúdo associado por `category_id` e `module_id`
- [x] Conteúdo da Academia configurável como PDF ou vídeo
- [ ] Validação visual autenticada em desktop e mobile

### Checkpoint 2 — Conteúdo e experiência do membro
- [ ] Biblioteca, favoritos e organização de conteúdos
- [ ] Proteção e substituição segura de PDFs
- [ ] Proteção, reprodução e progresso de vídeos
- [ ] Pré-visualização editorial antes da publicação
- [ ] Estados de erro, vazio e carregamento

### Checkpoint 3 — Operação SaaS no Admin Master
- [ ] Gestão completa de usuários, papéis e acessos
- [ ] Cortesia com prazo, suspensão e reativação
- [ ] Consulta de assinatura e progresso do membro
- [ ] Publicar, despublicar, arquivar e mover conteúdos
- [ ] Histórico de auditoria administrativa

### Checkpoint 4 — Segurança e integrações críticas
- [ ] Auditoria de autenticação e recuperação de senha
- [ ] Auditoria do checkout, Stripe, webhooks e liberação pós-pagamento
- [ ] Auditoria de permissões, RLS e armazenamento
- [ ] Auditoria de variáveis, arquivos e logs
- [ ] Propostas críticas apresentadas antes de qualquer alteração

### Checkpoint 5 — Validação integral
- [ ] Classificar as 22 áreas como funcionando, parcial, quebrado, ausente, inseguro ou precisa de teste
- [ ] Typecheck, lint, build e testes automatizados
- [ ] Testes desktop e mobile
- [ ] Teste ponta a ponta completo sem publicar em produção

### Checkpoint 6 — Google Drive opcional
- [ ] Revisão de importação no Admin Master
- [ ] Mapeamento de pastas sem publicação automática
- [ ] Conflitos resolvidos manualmente antes de alterar conteúdo
