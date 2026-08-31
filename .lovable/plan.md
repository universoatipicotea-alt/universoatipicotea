# Home reestruturada com conteúdo real

Hoje `/` (visitante) e `/inicio` (membro) renderizam o mesmo componente `src/pages/Home.tsx`, que só tem hero, métricas e três blocos genéricos de benefício. Nenhum dos 6 PDFs publicados aparece.

## O que muda

**Separar as duas Homes**

- `/` continua a landing de venda (hero, prova, CTA de assinatura), agora com uma prévia real do acervo: capas dos guias e das receitas publicados, sem liberar o conteúdo.
- `/inicio` passa a ser o painel do membro, com "Olá, {nome}" e "Continue explorando o seu Universo".

**Seções do painel `/inicio`, nesta ordem**

1. **Continue de onde parou** — só aparece quando existe progresso real de leitura gravado (capa, título, categoria, progresso, "Continuar da página X"). Sem progresso, a seção não é exibida.
2. **Guias em destaque** — até 3 dos guias publicados da Academia Atípica (os 4 PDFs já no ar), com capa, título, categoria e resumo. CTA "Ver todos" → Academia.
3. **Receitas** — até 3 receitas publicadas (os 2 PDFs de receitas já no ar), mesmo padrão de card. CTA "Ver todas" → Receitas.
4. **Vídeos** — lista apenas vídeos realmente cadastrados. Hoje existe só o vídeo do funil; se não houver vídeo para membros, a seção mostra um estado vazio elegante em vez de conteúdo inventado.
5. **Perguntas frequentes** — accordion discreto com as dúvidas reais do produto (o que está incluso, como funciona a assinatura de R$ 49,90/mês, cancelamento, acesso aos PDFs, natureza educativa dos conteúdos), com link para Ajuda e para as páginas institucionais.

Nada de números, progresso, receitas ou vídeos fictícios: onde não houver dado, entra estado vazio com CTA.

## Detalhes técnicos

- `src/lib/community.server.ts`: estender `community.landing` com uma prévia pública (capa/título/categoria dos guias e receitas publicados, sem PDF nem conteúdo) e `community.memberDashboard` com receitas publicadas (`ua_test_guides`), progresso de leitura do usuário (`ua_reading_progress`) e vídeos disponíveis. Sem tocar em Stripe, checkout, webhook ou cobrança.
- `src/pages/Home.tsx`: fica só com a landing pública.
- Novo `src/pages/Inicio.tsx` (usado por `src/routes/inicio.tsx`): painel do membro com as 5 seções acima, dentro do `MemberShell`.
- Novo `src/components/ContentCard.tsx` reutilizável (capa, título, categoria, resumo, CTA) para padronizar guias, receitas e vídeos — reaproveitado depois em Academia, Receitas e Biblioteca.
- FAQ em accordion com o componente shadcn já existente.
- Revisão mobile das seções (carrossel horizontal com toque confortável em vez de grade apertada).
