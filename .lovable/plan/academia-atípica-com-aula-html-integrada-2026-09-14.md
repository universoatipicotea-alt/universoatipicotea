# Academia Atípica com aula HTML integrada

## Experiência da aula
- Criar um visualizador exclusivo da Academia que mantenha o menu lateral e substitua o conteúdo central pela aula interativa.
- Usar o endereço protegido já existente, com largura total e altura baseada na tela, sem modal, nova aba ou download.
- No celular, preservar o menu móvel atual e dar prioridade máxima à largura e altura da aula.
- Manter o leitor de PDF existente sem alterações.

## Módulos e conteúdo
- Corrigir o título para usar singular ou plural conforme a quantidade real retornada.
- Confirmar que os três módulos publicados e as 16 aulas estão vinculados corretamente pelos dados reais.
- Aplicar somente a atualização de dados já versionada caso ela ainda não esteja no Lovable Cloud; não criar dados visuais fictícios.

## Segurança e compatibilidade
- Preservar login, assinatura ou acesso administrativo, publicação da aula, token temporário e `no-store`.
- Manter os 16 arquivos HTML oficiais inalterados e fora da pasta pública.
- Não alterar Biblioteca, Receitas, outros conteúdos ou o visualizador global de PDF.

## Validação
- Ampliar os testes automatizados para cobertura dos três módulos, 16 aulas, visualizador integrado e proteção da rota.
- Rodar testes automatizados, verificação de tipos e lint focado; a plataforma também executará a compilação.
- Testar desktop, tablet e celular no preview local ou externo disponível, incluindo uma aula de cada módulo e interações internas.

## Entrega
- Registrar o resultado no roadmap.
- Não publicar nem fazer merge automático.
- Informar claramente qualquer atualização pendente no Lovable Cloud e os passos para visualizar a mudança.
