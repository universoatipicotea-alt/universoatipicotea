# Auditoria — evolução de Facilitadores para Loja Mundo Azul

## Estrutura encontrada

- A área de membros usava a rota `/facilitadores`, a página `src/pages/Facilitators.tsx` e os dados retornados por `community.memberDashboard`.
- O cadastro administrativo usava a aba técnica `facilitators` em `src/pages/Admin.tsx` e o endpoint legado `community.admin.saveFacilitator`.
- A fonte era `public.ua_facilitators`, com título, resumo, categoria, imagem, link externo, status e ordem.
- As imagens já eram enviadas ao bucket privado existente e servidas pela rota controlada `/api/public/ua-image/*`.
- Admin e Admin Master já tinham acesso à gestão; essa regra foi preservada.
- `public.ua_products` pertence ao funil comercial/campanhas existente. Ele não foi copiado nem unido automaticamente à loja.

## Decisões

- `ua_facilitators` permanece a fonte única dos produtos e mantém os IDs e imagens existentes.
- O nome técnico legado é preservado onde uma renomeação poderia quebrar integrações.
- Visibilidade pública é opt-in e inicia como `false`; registros legados continuam visíveis somente para membros.
- Categorias/coleções e configurações da home ganharam tabelas auxiliares, sem duplicar produtos.
- A compra permanece em links HTTPS externos. O carrinho é uma seleção local e não representa pedido ou checkout.
- `/facilitadores` e a gestão antiga redirecionam para as novas experiências.

## Segurança

- As novas tabelas mantêm RLS habilitado e não concedem leitura direta a `anon` ou `authenticated`.
- A leitura pública passa pelo servidor com projeção mínima, `status=published` e `visible_public=true`.
- A leitura de membros exige sessão e acesso ao conteúdo, além de `visible_members=true`.
- Escritas exigem Admin ou Admin Master, como na gestão original.
