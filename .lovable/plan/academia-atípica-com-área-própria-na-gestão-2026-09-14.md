# Academia Atípica com área própria na gestão

Hoje, dentro de "Conteúdo e produtos", existem três itens soltos: "Academia Atípica", "Módulos" e "Aulas da Academia". A ideia é reunir tudo em uma área única da Academia, com rotas próprias no menu lateral.

## Como fica o menu

Nova seção no menu lateral da gestão, logo antes de "Conteúdo e produtos":

```text
Academia Atípica
  ├─ Visão geral      /gestao/academia
  ├─ Módulos          /gestao/academia/modulos
  └─ Aulas            /gestao/academia/aulas
```

Em "Conteúdo e produtos" ficam apenas os itens que não são da Academia: Receitas, Categorias e Importação do Drive.

## O que cada tela faz

- **Visão geral**: a tela atual da Academia (guias e materiais), sem mudanças de funcionamento.
- **Módulos**: a tela de módulos que você já aprovou (resumo, filtros por situação, busca, contagem de aulas, arquivar/reativar).
- **Aulas**: a tela de aulas criada agora (escolher módulo, criar/editar aula, enviar o HTML, ordem, publicar/despublicar).

Cada tela ganha um cabeçalho curto com atalhos entre as três, para trocar de área sem voltar ao menu.

## Endereços antigos

Os endereços antigos (`/gestao/conteudos/academia`, `/gestao/conteudos/modulos`, `/gestao/conteudos/aulas`) continuam funcionando e levam automaticamente para os novos, para não quebrar links salvos.

## Detalhes técnicos

- Novas rotas: `src/routes/gestao_.academia.tsx`, `gestao_.academia_.modulos.tsx`, `gestao_.academia_.aulas.tsx`, cada uma renderizando `<Admin fixedTab="guides" | "taxonomyModules" | "academyLessons" />` (mesmos componentes de hoje, sem duplicar lógica).
- `managementSections.ts`: nova `ManagementSection` "Academia Atípica" (ícone `GraduationCap`) com os três destinos; remover os três itens correspondentes da seção de conteúdo.
- `Admin.tsx`: mapear as novas rotas para as abas existentes; nenhuma mudança nos componentes `TaxonomyAdmin` e `AcademyLessonsAdmin`.
- Rotas antigas passam a `redirect` (no `beforeLoad`) para as novas.
- Sem mudanças no banco, no acesso pago, no leitor de PDF ou nos 16 HTMLs.

## Validação

Verificação de tipos, testes automatizados e conferência no preview: menu com a nova seção, as três telas abrindo e os endereços antigos redirecionando.  
  
FAZER ESTA MESMA ORGANIZAÇÃO PAR AS RECEITAS

&nbsp;