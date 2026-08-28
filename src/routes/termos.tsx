import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalList, LegalSection } from "@/components/LegalLayout";

export const Route = createFileRoute("/termos")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Termos de Uso — Universo Atípico" },
      {
        name: "description",
        content:
          "Regras de uso da plataforma Universo Atípico: conta, assinatura mensal de R$ 49,90, conteúdos, comunidade e responsabilidades.",
      },
      { property: "og:title", content: "Termos de Uso — Universo Atípico" },
      {
        property: "og:description",
        content:
          "Regras de uso da plataforma Universo Atípico: conta, assinatura mensal de R$ 49,90, conteúdos, comunidade e responsabilidades.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Institucional"
      title="Termos de Uso"
      intro="Estes termos descrevem as regras para usar o Universo Atípico — um ecossistema de conhecimento, experiências, pessoas e soluções para quem vive a realidade atípica. Ao criar uma conta e assinar, você concorda com o que está aqui."
    >
      <LegalSection title="1. O que é o Universo Atípico">
        <p>
          O Universo Atípico é uma plataforma digital por assinatura que reúne conteúdos,
          materiais, jornadas de aprendizagem, recomendações e uma comunidade de trocas. A
          comunidade é uma parte do ecossistema, não o produto inteiro.
        </p>
      </LegalSection>

      <LegalSection title="2. Conta">
        <LegalList
          items={[
            "A conta é pessoal e intransferível; o acesso não pode ser compartilhado.",
            "Você é responsável por manter a confidencialidade da sua senha e pelas atividades realizadas na sua conta.",
            "É necessário ter 18 anos ou mais para contratar a assinatura.",
            "Informações de cadastro devem ser verdadeiras e mantidas atualizadas.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Assinatura e acesso">
        <p>
          O acesso à plataforma exige assinatura ativa no valor de R$ 49,90 por mês, com renovação
          automática mensal. Enquanto a assinatura estiver ativa, você tem acesso completo ao
          Universo Atípico. As regras de cobrança, renovação e cancelamento estão detalhadas na
          Política de Assinatura e Cancelamento.
        </p>
      </LegalSection>

      <LegalSection title="4. Uso dos conteúdos">
        <LegalList
          items={[
            "Os conteúdos são licenciados para uso pessoal e não exclusivo enquanto durar sua assinatura.",
            "É proibido copiar, redistribuir, revender, publicar ou reproduzir materiais fora da plataforma sem autorização por escrito.",
            "É proibido burlar controles de acesso, extrair conteúdos de forma automatizada ou compartilhar arquivos protegidos.",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Conduta na comunidade">
        <p>
          A comunidade é um espaço de escuta e respeito. Não são permitidos discurso de ódio,
          discriminação, assédio, divulgação de dados pessoais de terceiros, spam, venda não
          autorizada de produtos ou serviços, nem conteúdo que prometa cura ou resultado garantido.
          Publicações que violem estas regras podem ser removidas e contas podem ser suspensas ou
          encerradas.
        </p>
      </LegalSection>

      <LegalSection title="6. Conteúdo publicado por você">
        <p>
          Você continua titular do que publica e é responsável pelo conteúdo compartilhado. Ao
          publicar, você autoriza o Universo Atípico a exibir esse conteúdo dentro da plataforma
          para os demais membros.
        </p>
      </LegalSection>

      <LegalSection title="7. Natureza informativa dos conteúdos">
        <p>
          Todo o material do Universo Atípico tem caráter informativo e educacional e não substitui
          avaliação, diagnóstico, prescrição ou acompanhamento de profissionais habilitados. Leia o
          Aviso de Responsabilidade e Natureza dos Conteúdos, que integra estes termos.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidade e mudanças">
        <p>
          Buscamos manter a plataforma disponível de forma contínua, mas pode haver interrupções
          para manutenção, atualizações ou por fatores externos. Podemos ajustar, incluir ou
          descontinuar funcionalidades e conteúdos ao longo do tempo, preservando a proposta do
          serviço contratado.
        </p>
      </LegalSection>

      <LegalSection title="9. Encerramento">
        <p>
          Você pode cancelar sua assinatura quando quiser. Podemos suspender ou encerrar o acesso em
          caso de descumprimento destes termos, fraude ou falta de pagamento.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações destes termos">
        <p>
          Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas pelos canais da
          plataforma e a data de atualização no topo indicará a versão vigente.
        </p>
      </LegalSection>

      <LegalSection title="Informações a preencher">
        <LegalList
          items={[
            "Razão social, CNPJ e endereço do responsável pela plataforma.",
            "E-mail oficial de atendimento e suporte.",
            "Foro eleito e legislação aplicável, caso haja preferência específica.",
          ]}
        />
      </LegalSection>
    </LegalLayout>
  );
}
