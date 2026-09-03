# Segurança dos arquivos de ambiente

## Inventário de nomes

O `.env` que estava rastreado continha somente estes nomes:

- `SUPABASE_PROJECT_ID`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

Os valores não foram incluídos neste relatório. A busca no histórico encontrou o arquivo em um commit. Retirá-lo do índice atual não o remove desse commit anterior.

O código também espera variáveis exclusivamente de servidor:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `STRIPE_PRODUCT_ID`
- `LOVABLE_DB_MIGRATION_URL`
- `LOVABLE_CRON_SECRET`
- `LOVABLE_CRON_SECRET_PREVIOUS`

Esses nomes estão documentados no `.env.example` sem valores. A busca por padrões retornou apenas referências de código ao formato `sb_secret_`; nenhum arquivo atual com um valor correspondente foi localizado.

## Credenciais potencialmente expostas

- URL, identificador e chave publicável do projeto Supabase presentes no `.env` histórico. A chave publicável é destinada ao cliente, mas sua segurança depende de RLS correto e deve ser revisada junto às políticas.
- Qualquer valor de servidor que tenha sido inserido manualmente no Lovable, GitHub, terminal ou mensagens não é inferido como seguro por esta busca. Eles devem ser comparados pelos responsáveis diretamente nos provedores, sem copiá-los para tickets ou commits.

## Plano de rotação — não executado

1. Confirmar no painel do Supabase quais chaves estão ativas e se a chave de serviço já apareceu em algum canal externo.
2. Revisar RLS antes de trocar a chave publicável; então gerar/substituir a chave se a equipe decidir pela rotação.
3. Rotacionar `SUPABASE_SERVICE_ROLE_KEY` se houver qualquer suspeita de exposição; atualizar primeiro o cofre do ambiente de teste, validar e só depois planejar produção.
4. No Stripe, criar novas chaves secretas restritas para teste e produção separadamente; atualizar o ambiente, validar e revogar as antigas.
5. Criar novo segredo de webhook, manter período de sobreposição controlado e validar assinaturas antes de remover o anterior.
6. Rotacionar URL de migração e segredos de cron no Lovable se tiverem sido compartilhados fora do cofre.
7. Registrar responsáveis, data e resultado da rotação na auditoria operacional.

Nenhuma credencial foi rotacionada e nenhuma variável do Lovable ou de produção foi alterada nesta branch.

## Histórico Git

Não foi feita reescrita de histórico. Se a remoção definitiva do arquivo antigo for necessária, será preciso uma autorização separada, janela coordenada e novo clone para todos os colaboradores e para o Lovable.
