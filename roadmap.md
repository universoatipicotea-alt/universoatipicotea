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
