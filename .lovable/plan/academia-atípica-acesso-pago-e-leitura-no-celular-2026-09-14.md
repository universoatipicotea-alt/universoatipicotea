# Academia Atípica: acesso pago e leitura no celular

## Situação conferida agora
- Os 3 módulos estão publicados e as 16 aulas em HTML já estão publicadas e ligadas: 3 aulas no módulo 1, 5 no módulo 2 e 8 no módulo 3. Não falta publicar nada; falta confirmar aula por aula.
- Hoje quem tem a marcação de "membro" entra na Academia mesmo sem pagamento confirmado. Existem 2 contas nessa situação, além da sua conta de administração.

## 1. Acesso somente para quem paga
- Passar a exigir pagamento ativo para qualquer conteúdo de membro (Academia, Biblioteca, Receitas, Comunidade).
- Criar uma marcação de cortesia por conta e ligá-la nas 2 contas atuais, para que continuem com acesso normal.
- Quem não tem pagamento nem cortesia: ao entrar, vai direto para a página de assinatura. As telas de membro não mostram nada do conteúdo, apenas o convite para assinar.
- A abertura de cada aula continua protegida no servidor, com verificação a cada acesso e link temporário.

## 2. Conferir as 16 aulas
- Verificar, aula por aula, que abre no centro da página com: lista de capítulos, barra de progresso do módulo, "Aula anterior", "Marcar como concluída" e "Próxima aula".
- Verificar que a última aula de cada módulo não oferece "próxima" inválida e que a conclusão atualiza o progresso.
- Ampliar os testes automatizados para cobrir os 3 módulos e as 16 aulas.

## 3. Leitura no celular estilo Kindle
- No celular a aula passa a ocupar a tela toda, com margens mínimas.
- Deslizar o dedo para o lado avança e volta as páginas/slides da aula, como num leitor de livro; as setas grandes continuam disponíveis.
- Indicador de página atual visível e área de toque confortável.
- Capítulos viram um painel que desliza por cima, com botão de fechar.
- Revisão geral de responsividade da Academia no celular e no tablet: lista de módulos, cards, títulos longos, barra de progresso e rodapé de navegação.
- Os 16 arquivos originais das aulas não são alterados.

## 4. Validação
- Testes automatizados, verificação de tipos e revisão de formatação.
- Conferência no preview em desktop, tablet e celular, abrindo uma aula de cada módulo.
- Conferência de que uma conta sem pagamento não vê nada e que Biblioteca, Receitas e o leitor de PDF continuam iguais.

## Detalhes técnicos
- Nova coluna de cortesia em `ua_users` (migração) e ajuste de `assertMemberContent` em `src/lib/community.server.ts` para exigir assinatura ativa, cortesia ou perfil administrativo.
- Redirecionamento pós-login e guarda nas páginas de membro para `/assinatura`.
- `src/components/AcademyLessonView.tsx`: modo tela cheia no celular, gestos de swipe encaminhados ao conteúdo da aula via eventos de teclado no iframe de mesma origem (sem editar os HTMLs), painel de capítulos em overlay.
- Nenhuma alteração no visualizador global de PDF nem nas rotas de Biblioteca/Receitas.
