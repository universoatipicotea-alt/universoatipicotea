# Revisão pós-merge — Loja Mundo Azul

## Migration

A migration histórica `20260918120000_store_mundo_azul.sql` foi auditada, mas não foi aplicada por esta revisão.

- mantém `ua_facilitators` como fonte única;
- adiciona campos e índices sem excluir registros;
- preenche apenas o slug técnico ausente;
- mantém produtos legados fora da vitrine pública;
- habilita RLS nas tabelas auxiliares;
- concede acesso direto somente ao `service_role`;
- não contém `DROP`, `TRUNCATE` ou publicação automática.

Não foi necessária uma migration corretiva. A aplicação em preview/staging continua sendo uma ação externa da infraestrutura do projeto.

## Como preparar produtos existentes para o preview

No Admin Master, acesse `/gestao/lojamundoazul`, abra **Produtos** e edite dois ou três registros existentes. Não crie duplicatas.

Preencha e confira:

1. nome e descrição curta;
2. slug único, em letras minúsculas e hífens;
3. foto principal;
4. link HTTPS de compra no parceiro;
5. categoria e, se aplicável, coleções;
6. preço e preço promocional real, quando houver;
7. disponibilidade;
8. descrição completa, destaques, modo de explorar, detalhes e cuidados reais;
9. galeria, variações, relacionados e complementares somente quando existirem;
10. `status = published`;
11. `visible_public = true`;
12. `visible_members = true` se também deve aparecer na experiência logada.

Marque **Em destaque**, **Mais vendidos**, **Novidade** ou **Kit** somente quando o dado for verdadeiro. Se nenhuma marcação existir, a seção correspondente não aparece.

## Checklist de revisão visual

Após a migration ser aplicada no preview e os produtos serem publicados:

- abrir `/lojamundoazul`;
- pesquisar pelo nome dos produtos;
- abrir categorias e coleções;
- testar filtros, ordenação e carrinho de seleção;
- abrir `/lojamundoazul/produto/:slug`;
- testar galeria, miniaturas, variações, quantidade e link externo;
- abrir `/lojamundoazul/membros` com uma conta autorizada;
- abrir `/gestao/lojamundoazul` como Admin ou Admin Master;
- repetir em 390 px, 430 px e desktop;
- confirmar que a página não possui rolagem horizontal.

O carrinho é uma lista local. Quantidade e variação precisam ser confirmadas no site parceiro; não existe checkout próprio nesta versão.

## Bloqueio de infraestrutura verificado

Em 18/09/2026, a revisão encontrou:

- nenhum deployment ou environment configurado no GitHub;
- nenhum secret ou variable de staging no repositório;
- nenhuma URL de preview associada ao PR;
- o projeto Lovable permaneceu carregando e não expôs um preview de branch;
- o fallback versionado aponta para o backend Lovable Cloud de produção;
- a cadeia de migrations do repositório não contém o baseline completo para criar um banco vazio.

Por isso, a migration não foi executada e nenhum produto foi tornado público.

### Ação externa necessária

Uma pessoa com acesso à infraestrutura Lovable/Supabase deve:

1. provisionar um projeto de staging isolado ou clonar somente o schema e os registros necessários, sanitizando dados pessoais;
2. configurar no ambiente de preview da branch:
   - `SUPABASE_URL`;
   - `SUPABASE_PUBLISHABLE_KEY`;
   - `SUPABASE_SERVICE_ROLE_KEY`;
   - `VITE_SUPABASE_URL`;
   - `VITE_SUPABASE_PUBLISHABLE_KEY`;
   - `LOVABLE_DB_MIGRATION_URL`, quando o runner de migrations utilizar essa variável;
3. confirmar que todas as URLs e chaves pertencem ao staging, e não ao projeto `*-prod.lovable.cloud`;
4. aplicar `supabase/migrations/20260918120000_store_mundo_azul.sql` somente no banco de staging;
5. configurar os redirects de autenticação para a URL de preview;
6. disponibilizar uma conta de teste membro e uma conta Admin/Admin Master no staging;
7. publicar dois ou três produtos existentes seguindo o checklist acima;
8. gerar a URL HTTPS do preview e repetir a revisão visual em 390 px, 430 px e desktop.

Não usar `supabase db push --linked`, SQL Editor ou credenciais cujo destino não esteja inequivocamente identificado como staging.
