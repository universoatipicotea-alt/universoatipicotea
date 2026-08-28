import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalList, LegalSection } from "@/components/LegalLayout";

export const Route = createFileRoute("/privacidade")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Universo Atípico" },
      {
        name: "description",
        content:
          "Como o Universo Atípico trata dados pessoais de cadastro, autenticação, pagamentos e cookies na plataforma de assinatura.",
      },
      { property: "og:title", content: "Política de Privacidade — Universo Atípico" },
      {
        property: "og:description",
        content:
          "Como o Universo Atípico trata dados pessoais de cadastro, autenticação, pagamentos e cookies na plataforma de assinatura.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Institucional"
      title="Política de Privacidade"
      intro="Esta política explica quais dados pessoais o Universo Atípico coleta, por que os coletamos e como você pode exercer seus direitos. Ela trata exclusivamente de privacidade e proteção de dados."
    >
      <LegalSection title="1. Quem trata seus dados">
        <p>
          O Universo Atípico é o responsável pelo tratamento dos dados pessoais coletados na
          plataforma. Os dados de identificação completa do controlador e o canal oficial de contato
          do encarregado estão listados na seção “Informações a preencher”, ao final desta página, e
          serão publicados assim que confirmados.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <LegalList
          items={[
            "Dados de cadastro: nome e e-mail informados na criação da conta.",
            "Dados de autenticação: senha armazenada de forma criptografada, registros de login e identificadores de sessão.",
            "Dados de assinatura: status do plano, data de início, renovação e cancelamento, e identificadores da transação.",
            "Dados de pagamento: processados diretamente pelo Stripe. Não armazenamos número completo de cartão, código de segurança ou dados bancários em nossos sistemas.",
            "Dados de uso da plataforma: conteúdos acessados, progresso de leitura, anotações, tópicos e comentários publicados por você.",
            "Dados técnicos: endereço IP, tipo de navegador e dispositivo, coletados para segurança e funcionamento do serviço.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Para que usamos os dados">
        <LegalList
          items={[
            "Criar e manter sua conta e permitir a autenticação segura.",
            "Processar a assinatura mensal e liberar ou encerrar o acesso conforme o status do pagamento.",
            "Disponibilizar conteúdos, salvar progresso e permitir a participação na comunidade.",
            "Enviar comunicações operacionais sobre conta, pagamento e mudanças no serviço.",
            "Prevenir fraudes, abusos e usos que violem os Termos de Uso.",
            "Cumprir obrigações legais, contábeis e regulatórias.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Bases legais">
        <p>
          Tratamos seus dados com base na execução do contrato de assinatura, no cumprimento de
          obrigações legais e regulatórias, no legítimo interesse de manter a segurança da
          plataforma e, quando aplicável, no seu consentimento — por exemplo, para comunicações de
          marketing e cookies não essenciais.
        </p>
      </LegalSection>

      <LegalSection title="5. Compartilhamento com terceiros">
        <p>
          Compartilhamos dados apenas com prestadores necessários ao funcionamento do serviço, que
          tratam as informações conforme nossas instruções:
        </p>
        <LegalList
          items={[
            "Stripe — processamento de pagamentos e gestão da assinatura.",
            "Provedor de infraestrutura, banco de dados, autenticação e armazenamento de arquivos utilizado pela plataforma.",
            "Autoridades públicas, quando houver requisição legal válida.",
          ]}
        />
        <p>Não vendemos dados pessoais.</p>
      </LegalSection>

      <LegalSection title="6. Transferência internacional">
        <p>
          Alguns desses prestadores podem processar dados em servidores localizados fora do Brasil.
          Nesses casos, exigimos que o tratamento observe padrões de proteção compatíveis com a
          legislação brasileira.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies">
        <p>
          Utilizamos cookies essenciais para manter sua sessão autenticada e garantir a segurança do
          acesso — sem eles a plataforma não funciona. Cookies de análise ou marketing, quando
          utilizados, dependem do seu consentimento e podem ser recusados sem prejuízo do acesso ao
          conteúdo assinado. Você também pode gerenciar cookies nas configurações do seu navegador.
        </p>
      </LegalSection>

      <LegalSection title="8. Retenção">
        <p>
          Mantemos os dados enquanto sua conta estiver ativa. Após o encerramento, guardamos apenas
          o necessário para cumprir obrigações legais, fiscais e para defesa de direitos, eliminando
          o restante com segurança.
        </p>
      </LegalSection>

      <LegalSection title="9. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais como criptografia em trânsito, senhas
          armazenadas de forma cifrada e controle de acesso por perfil. Nenhum sistema é
          absolutamente infalível; por isso mantemos monitoramento e revisões contínuas.
        </p>
      </LegalSection>

      <LegalSection title="10. Seus direitos">
        <p>
          Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade,
          eliminação de dados, informação sobre compartilhamentos e revogação de consentimento. Basta
          escrever para o canal de contato informado abaixo.
        </p>
      </LegalSection>

      <LegalSection title="11. Dados de crianças e adolescentes">
        <p>
          A conta na plataforma é destinada a pessoas maiores de 18 anos. Ao compartilhar
          informações sobre crianças ou adolescentes na comunidade, evite dados identificáveis e
          lembre-se de que essa publicação é uma escolha sua, sob sua responsabilidade.
        </p>
      </LegalSection>

      <LegalSection title="12. Alterações desta política">
        <p>
          Podemos atualizar esta política para refletir mudanças no serviço ou na legislação. A data
          de atualização no topo da página sempre indicará a versão vigente.
        </p>
      </LegalSection>

      <LegalSection title="Informações a preencher">
        <p>
          Para que esta política fique juridicamente completa, ainda precisamos dos seguintes dados,
          que não devem ser presumidos:
        </p>
        <LegalList
          items={[
            "Razão social, CNPJ e endereço completo do responsável pela plataforma.",
            "E-mail oficial de privacidade e nome do encarregado (DPO), se houver.",
            "Confirmação de quais ferramentas de análise, métricas ou marketing são utilizadas (por exemplo, analytics, pixels ou remarketing).",
            "Se há envio de e-mails de marketing e por qual provedor.",
            "Prazos específicos de retenção adotados após o encerramento da conta.",
            "Foro ou legislação aplicável desejada, caso diferente do padrão brasileiro.",
          ]}
        />
      </LegalSection>
    </LegalLayout>
  );
}
