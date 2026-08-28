# Atípico Connect

# Prompt para o Lovable — Universo Atípico

Você está recebendo o código existente do projeto **Universo Atípico**, uma plataforma brasileira para famílias atípicas. Este projeto já possui funcionalidades importantes e não deve ser reescrito do zero. Antes de alterar qualquer coisa, leia o `README.md`, este prompt, `GUIA_TRANSFERENCIA_CHATGPT_LOVABLE.md`, `todo-fvxyznca.md` e a estrutura completa de `client/`, `server/`, `drizzle/` e `shared/`.

## Objetivo principal

Aperfeiçoe o projeto preservando a arquitetura e os fluxos que já funcionam. A plataforma deve separar claramente três experiências: navegação pública, comunidade autenticada gratuita e Academia Atípica com conteúdo especial e futura monetização.

Visitantes devem conseguir acessar a home, conhecer a proposta, navegar pela Biblioteca e abrir a landing page da Academia sem criar conta. O login deve ser exigido apenas quando o visitante tentar usar recursos pessoais ou ler um PDF protegido dentro da plataforma. Não obrigue o visitante a passar pelo funil da comunidade para conhecer a Academia.

## Landing page pública da Academia Atípica

Preserve e aperfeiçoe a rota pública compartilhável `/academia-atipica`. O botão **“Quero fazer parte”** da home, da navegação pública e da área Academia deve abrir diretamente essa landing page. A URL precisa funcionar quando for copiada e compartilhada em redes sociais, WhatsApp ou anúncios.

A landing deve conter um hero forte, uma explicação acolhedora da Academia, benefícios, materiais disponíveis, diferenciais, seção sobre leitura protegida, chamada para ação e rodapé. A linguagem deve ser clara, humana e sem promessas exageradas. A landing deve apresentar a Academia como um ambiente de receitas, estratégias e materiais para famílias atípicas, respeitando ritmos individuais e evitando soluções universais.

Neste momento, **não configure pagamento, checkout, preço, assinatura ou cobrança**. O CTA final deve encaminhar ao fluxo existente da plataforma, por exemplo para `/entrar`, deixando a integração de pagamento preparada para uma etapa futura, mas sem simulá-la. Não crie botões que aparentem cobrar o usuário.

A rota `/academia` deve continuar sendo o espaço de conteúdo da Academia. A rota `/academia-atipica` é a página de divulgação pública. Mantenha a diferença entre as duas rotas.

## Biblioteca pública e PDFs protegidos

A Biblioteca gratuita deve abrir sem cadastro e exibir busca, filtros, categorias, cards e metadados dos guias. O catálogo público pode mostrar título, resumo, categoria, chamada e data, mas nunca deve entregar chave de storage, URL original ou bytes do PDF.

Quando uma pessoa não autenticada clicar em **“Ler PDF”**, mostre uma mensagem clara informando que é necessário criar uma conta gratuita para ler o arquivo, salvar o progresso e fazer anotações. Em seguida, encaminhe para `/entrar?next=...`, preservando o guia solicitado para retorno posterior. Não abra o leitor para visitantes sem sessão.

Para usuários autenticados, preserve o leitor interno baseado em PDF.js, a renderização contínua de todas as páginas, zoom, tela cheia, rolagem, botão X, Escape, retomada de página, progresso por usuário e documento e anotações pessoais por usuário, documento e página.

PDFs protegidos devem ser servidos somente por rota same-origin autenticada, como `/api/protected-pdf/...`. Não exiba download, “abrir em nova aba”, link direto de storage ou seleção de texto para conteúdo protegido. A proteção deve existir no backend, não apenas no frontend.

## Autenticação e autorização

Preserve o sistema próprio de e-mail e senha. Não reintroduza dependência obrigatória do login OAuth do Manus. Mantenha hash de senha com scrypt, sessão em cookie HTTP-only, invalidação server-side, proteção de rotas e autorização no servidor.

O Admin Master e as permissões granulares devem continuar funcionando. O painel administrativo deve manter gerenciamento de usuários, papéis, níveis customizados e permissões. Não exponha hashes, tokens ou dados privados ao navegador.

A recuperação de senha por e-mail foi deixada para uma etapa futura porque ainda depende da escolha de um provedor de envio. Não implemente um provedor falso, não grave credenciais no código e não simule envio real.

## Produto teste e Academia

O Produto teste administrativo deve continuar separado da curadoria pública e acessível somente ao Admin Master. O cadastro atual permite título, resumo, chamada, categoria, cor, capa e PDF, com limite de PDF de até 50 MB. Preserve o armazenamento seguro e a separação dos dados.

O material **“Receitas Saudáveis e Criativas”** já foi importado e deve permanecer no catálogo da Academia com categoria `Alimentação`. O leitor validado possui 15 páginas. Não duplique o material nem crie dados fictícios.

## Logo e identidade visual

Vou fornecer a logo oficial separadamente. Use exatamente esse arquivo ou asset. Não gere outra logo, não substitua por ícone genérico e não use uma marca alternativa. Centralize a logo no componente `client/src/components/Brand.tsx` e reutilize-a em cabeçalho, rodapé, sidebar, navegação mobile, login e páginas públicas.

Se a logo falhar, mostre o texto **“Universo Atípico”** como fallback visível e acessível; nunca deixe uma imagem quebrada ou esconda completamente a marca.

Preserve a identidade visual editorial e acolhedora:

| Elemento | Direção visual |

| --- | --- |

| Fundo principal | Papel/off-white, claro e arejado |

| Hero e faixas fortes | Azul-marinho ou verde profundo |

| Acentos | Verde-sálvia e verde-sálvia claro |

| Cards secundários | Linho, bege claro e branco |

| Detalhes editoriais | Argila/terracota |

| CTA da Academia | Dourado claro sobre fundo escuro |

| Tipografia | Títulos arredondados e expressivos; corpo com alta legibilidade |

| Forma | Cantos generosos, sombras suaves e bastante espaço em branco |

Garanta contraste de cor, foco visível, navegação por teclado, textos alternativos e boa experiência em celular. Não transforme a landing em um dashboard genérico.

## Responsividade e navegação

A navegação pública deve ter links claros para Home, Biblioteca gratuita e Academia Atípica. No mobile, use menu acessível e CTA visível. Evite obrigar o visitante a entrar para navegar entre páginas públicas.

A comunidade, fórum, perfil, administração, Produto teste e leitura de PDFs continuam protegidos. Toda página privada deve ter uma saída clara e não pode ficar presa em modal ou rota sem retorno.

## O que ainda precisa ser aperfeiçoado

Revise especialmente os seguintes pontos sem quebrar o que já foi implementado:

1. Confirmar que a Biblioteca pública não abre PDF para visitante sem sessão e sempre mostra a mensagem e o redirecionamento com `next`.

1. Melhorar a experiência visual e a conversão da landing `/academia-atipica` sem adicionar pagamento.

1. Confirmar que todos os botões “Quero fazer parte” apontam para a landing compartilhável.

1. Garantir que a logo oficial enviada por mim apareça corretamente em todas as telas, com fallback textual acessível.

1. Revisar o leitor PDF em desktop, tablet e celular, especialmente X, Escape, painel de anotações, zoom e retomada.

1. Corrigir eventuais problemas de domínio, SSL, storage ou carregamento sem expor arquivos protegidos.

1. Avaliar se o bloco administrativo “Novo guia de teste / Personalize a apresentação” deve ser removido ou apenas movido para uma área administrativa; não o elimine sem preservar o cadastro ou sem uma decisão explícita.

## Regras de segurança e conteúdo

Nunca crie avaliações, estrelas, depoimentos, comentários de clientes ou números de prova social fictícios. Não fabrique usuários, vendas, compras ou resultados. Não coloque senhas, chaves, tokens ou URLs privadas no frontend. Não use links públicos de PDFs protegidos.

Preserve React 19, TypeScript, Vite, Tailwind 4, Express, tRPC 11, Drizzle ORM, MySQL/TiDB e PDF.js, salvo incompatibilidade técnica comprovada. Prefira alterações incrementais e componentes reutilizáveis.

## Validação obrigatória

Depois das alterações, execute:

```bash

pnpm check

pnpm test

pnpm build

```

Valide também, em uma sessão sem login, a home pública, `/biblioteca`, `/academia-atipica`, o CTA **“Quero fazer parte”**, o clique em **“Ler PDF”** e o redirecionamento para `/entrar?next=...`. Em uma sessão autenticada, valide a abertura do leitor, todas as páginas do PDF de receitas, progresso, anotações, X, Escape e retorno à página anterior.

Não considere o trabalho concluído se a landing não puder ser aberta diretamente por URL compartilhável, se a Biblioteca exigir login apenas para navegar, se o PDF protegido ficar acessível sem sessão ou se a logo oficial não estiver visível.

## Resultado esperado

Entregue uma versão mais refinada do Universo Atípico, com navegação pública sem cadastro, Biblioteca pública com leitura protegida, landing compartilhável da Academia Atípica, CTA “Quero fazer parte” funcionando, pagamento ainda desativado, autenticação própria preservada, logo oficial aplicada e leitor PDF seguro mantido.

Ao final, explique quais arquivos foram alterados, quais testes passaram, quais decisões foram tomadas e quais itens continuam pendentes. Não substitua a logo oficial, não configure pagamentos e não reescreva o sistema sem necessidade.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/185e0ce3-6ed2-4d57-9f2c-b6da42158e5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
