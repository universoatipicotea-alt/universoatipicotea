# Menu lateral mobile: foco preso, Escape e retorno do foco

## Situação atual

O menu mobile do cabeçalho público (`src/components/PublicHeader.tsx`) usa o componente Sheet, que já traz travamento de foco, fechamento com Escape e devolução do foco ao botão que abriu. O que falta é o comportamento em volta disso:

- O menu não fecha ao tocar em um item de navegação (os links são de rolagem por âncora, então o painel continua aberto por cima do conteúdo).
- Não há confirmação de que o foco volta ao botão do menu depois de navegar.
- O mesmo padrão precisa valer para o menu lateral da área logada (`src/components/DashboardLayout.tsx`).

## O que será feito

1. **Controlar a abertura do menu** no cabeçalho público: estado próprio de aberto/fechado, para poder fechá-lo por código.
2. **Fechar ao escolher um item**: qualquer link do menu (navegação, "Entrar", "Começar agora") fecha o painel antes de navegar/rolar.
3. **Escape**: garantido pelo painel; confirmado em teste, incluindo quando o foco está em um link interno.
4. **Devolver o foco ao botão do menu** sempre que o painel fecha — por Escape, por clique fora ou por escolha de item —, usando uma referência ao botão e devolvendo o foco após o fechamento.
5. **Foco preso enquanto aberto**: Tab e Shift+Tab circulam apenas entre os elementos do painel; o conteúdo atrás fica inerte para leitores de tela.
6. **Estado anunciado**: o botão passa a expor `aria-expanded` e `aria-controls`, com rótulo alternando entre "Abrir navegação" e "Fechar navegação".
7. **Mesmo tratamento no menu lateral da área logada**, para que o comportamento seja idêntico dentro e fora da plataforma.

## Verificação

Teste automatizado de teclado no navegador: abrir com Enter, percorrer com Tab até o fim e confirmar que volta ao primeiro item, pressionar Escape e conferir que o painel fecha e o foco está de novo no botão do menu; repetir fechando por clique em um item.

## Detalhes técnicos

- `Sheet` controlado por `open`/`onOpenChange`; `ref` no gatilho e `onCloseAutoFocus` para devolver o foco explicitamente.
- Fechamento dos links via `onClick` que zera o estado antes da navegação por âncora.
- Nenhuma mudança visual: identidade, espaçamentos e conteúdo do menu permanecem como estão.
