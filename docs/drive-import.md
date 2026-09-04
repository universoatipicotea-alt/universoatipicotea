# Importação assistida do Google Drive

## Escopo e garantias

A importação é opcional e exclusiva do Admin Master. O cadastro manual de módulos e conteúdos continua disponível. A busca apenas cria uma prévia; a execução exige seleção e confirmação, importa no máximo cinco itens por requisição e deixa todo guia criado ou atualizado como `draft`.

Ela nunca move, renomeia ou exclui arquivos do Drive. Capas são copiadas para `guias-capas`, PDFs para o bucket privado `guias-pdf` e vídeos permanecem no Drive. Vídeos são entregues por proxy com token HMAC temporário; PDFs não recebem link público permanente.

## Configuração mínima de staging

Aplicar, apenas no banco de staging e na ordem do repositório:

- `20260904143000_add_academy_module_states.sql`;
- `20260904150000_add_drive_import_ledger.sql`.

Configurar as variáveis server-only documentadas em `.env.example`:

- `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL`;
- `GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY`;
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`;
- `GOOGLE_DRIVE_MODULE_COVERS_FOLDER_ID`;
- `GOOGLE_DRIVE_EXTRA_FOLDER_IDS`;
- `DRIVE_MEDIA_SIGNING_SECRET` com pelo menos 32 caracteres.

Compartilhar somente as pastas autorizadas com o e-mail da conta de serviço, papel **Leitor**. Não usar delegação de domínio, chave no frontend, link público ou permissão de escrita.

## Fluxo operacional

1. Entrar como `admin_master` e abrir **Importação do Drive**.
2. Conferir as pastas e clicar em **Buscar arquivos**.
3. Revisar módulo, título, posição, capa, versão, situação e alertas.
4. Corrigir o relacionamento manualmente quando necessário.
5. Marcar confirmação individual para qualquer item existente.
6. Importar somente os itens selecionados.
7. Revisar descrição, duração e revisão técnica no editor manual.
8. Pré-visualizar e publicar manualmente em uma operação posterior.

O PDF adicional “Meu filho é AUTISTA. E agora?” permanece bloqueado e não pode ser selecionado até decisão editorial.

## Correspondência, atualização e duplicidade

- A identidade externa é `drive_file_id`, protegido por índice único.
- Pasta-pai, número inicial e nome normalizado apoiam a sugestão, mas o nome nunca é a identidade única.
- `drive_version`, `drive_modified_at` e checksum permitem detectar nova versão.
- Um módulo existente nunca é duplicado para receber capa.
- Um arquivo já registrado exige confirmação de atualização.
- Conteúdo sem módulo válido ou sem PDF/vídeo é rejeitado pelo backend.
- Word, referências e documentos de produção são exibidos como ignorados e preservados.

## Rollback e auditoria

Cada lote e item mantém origem, decisão, snapshot anterior, destino, arquivos copiados, responsável e resultado. Uma falha intermediária aciona compensação para restaurar o snapshot e remover cópias do lote.

O rollback manual:

- restaura capas/guias atualizados;
- remove apenas guias novos que ainda estejam em `draft`;
- remove apenas objetos copiados por aquele lote;
- é bloqueado se o registro foi editado ou publicado depois da importação;
- registra sucesso ou falha em `ua_audit_events`.

O rollback não altera o Drive.

## Validação antes de produção

- aplicar migrations em um banco vazio e em uma cópia estrutural de staging;
- testar prévia, deduplicação, conflito, confirmação, falha parcial e rollback;
- testar `visitor`, `member`, `admin` e `admin_master`;
- confirmar buckets e limites de tamanho (8 MiB para imagem, 25 MiB para PDF);
- validar seek de vídeo e expiração do token;
- testar desktop e mobile com dados de staging;
- revisar a permissão ampla encontrada na pasta do guia adicional antes de qualquer organização do Drive.

Nenhuma migration desta branch foi aplicada em produção e nenhum arquivo do Drive foi modificado durante a implementação.

## Resultado deste checkpoint local

- 33 testes Node aprovados, incluindo papéis, deduplicação, confirmação, rollback, token de vídeo e barreira exclusiva do Admin Master.
- Typecheck, lint direcionado e build Vite/Nitro aprovados.
- O servidor de desenvolvimento respondeu em desktop e no breakpoint móvel confiável de 500 px; a barreira de autenticação permaneceu responsiva.
- A tela autenticada de importação, o Storage e a execução real não foram simulados com dados falsos. Eles dependem de Supabase staging, migration aplicada, conta `admin_master` sintética e conta de serviço Drive com acesso de leitura.
- O comando `vite preview` deste projeto procurou o artefato legado `dist/server/server.js`, embora o build atual gere `.output`; a validação local foi feita com `vite dev`. Isso não afetou o build, mas deve permanecer registrado como dívida de configuração do preview.
