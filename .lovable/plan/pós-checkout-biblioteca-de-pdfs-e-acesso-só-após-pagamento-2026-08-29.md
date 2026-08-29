# Pós-checkout, biblioteca de PDFs e acesso só após pagamento

## 1. Página de confirmação pós-checkout (`/obrigado`)

Nova rota para onde o Stripe devolve o cliente depois do pagamento.

- Lê o `session_id` da URL e consulta o status real da assinatura no servidor.
- Três estados claros: **processando** (com nova checagem automática), **pagamento confirmado** e **pagamento não concluído** (com botão para tentar de novo).
- Confirmado e sem conta: mostra o formulário de criação de conta já com o e-mail usado no pagamento preenchido e bloqueado; ao concluir, vincula a assinatura e leva direto para `/comunidade`.
- Confirmado e já logado: redireciona automaticamente para `/comunidade` em poucos segundos.
- O `success_url` do Stripe passa a apontar para `/obrigado`.

## 2. Entrada só depois do pagamento (`/entrar`)

- Remove o botão/alternância "Criar conta" da página de login.
- A página passa a ter apenas login + um link discreto "Ainda não é assinante? Começar agora" que leva ao checkout.
- A criação de conta fica disponível apenas na confirmação pós-pagamento (e para quem chega com um pagamento válido).

## 3. Publicar os 6 PDFs enviados

Os arquivos vão para o armazenamento privado e entram no banco já publicados:

Biblioteca (guias):
- Autismo: 40 Dicas para Agir em Família
- Guia de Desfralde para Crianças Autistas — Edição Premium
- Guia Técnica: Introdução Gradual de Novos Alimentos (TEA)
- Guia de Substituições para Alergias Alimentares (TEA)

Receitas:
- Mini Ebook: 5 Receitas (Autismo e TDAH)
- Receitas Saudáveis e Criativas

Cada material recebe título, resumo, categoria e capa próprios.

## 4. Capas

Capas exclusivas desenhadas para cada material, no estilo atual da marca (papel, tinta, verde profundo, dourado) — nada de placeholder. Aplicadas nos cards da Biblioteca e das Receitas.

## 5. Campo de PDF das receitas na Administração

- Nova aba **Receitas** no painel de administração, com o mesmo padrão da aba Guias: título, resumo, categoria, ordem, status, **upload de PDF** e **upload de capa**.
- O upload de PDF passa a aceitar arquivos grandes (até ~50 MB), enviando direto para o armazenamento em vez de trafegar embutido na requisição — os arquivos atuais têm entre 25 e 46 MB e não passariam pelo limite antigo de 12 MB.
- Listagem lateral com edição das receitas já cadastradas.

## 6. Leitura em boa qualidade no celular

Ajustes no leitor de PDF:
- Renderização na densidade real da tela (retina) em vez de escala fixa — texto nítido no celular.
- Largura ajustada automaticamente à tela, com zoom por pinça e botões de zoom.
- Carregamento por página conforme a rolagem, para PDFs grandes abrirem rápido no 4G.
- Barra de controles compacta e alcançável com o polegar em telas pequenas.
- Conteúdo continua protegido: entregue por link temporário assinado, nunca por URL pública.

## Detalhes técnicos

- `/obrigado`: rota TanStack com `head()` próprio; status via `billing.session` + `billing.sync` já existentes, mais um estado de re-tentativa enquanto o webhook não confirmou.
- Upload grande: `createSignedUploadUrl` no bucket privado `guias-pdf`, com o navegador enviando o arquivo direto e o servidor apenas registrando a chave.
- Receitas seguem a tabela `ua_test_guides` (já usada por `/receitas`); guias seguem `ua_guides`.
- Leitor: `devicePixelRatio` no `viewport` do pdf.js, `IntersectionObserver` para renderização sob demanda.
- Ingestão dos 6 PDFs por upload ao armazenamento + migração com os registros e capas.
