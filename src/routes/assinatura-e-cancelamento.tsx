import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalList, LegalSection } from "@/components/LegalLayout";

export const Route = createFileRoute("/assinatura-e-cancelamento")({
  component: SubscriptionPolicyPage,
  head: () => ({
    meta: [
      { title: "Política de Assinatura e Cancelamento — Universo Atípico" },
      {
        name: "description",
        content:
          "Como funciona a assinatura de R$ 49,90/mês do Universo Atípico: cobrança, renovação automática, cancelamento e arrependimento.",
      },
      { property: "og:title", content: "Política de Assinatura e Cancelamento — Universo Atípico" },
      {
        property: "og:description",
        content:
          "Como funciona a assinatura de R$ 49,90/mês do Universo Atípico: cobrança, renovação automática, cancelamento e arrependimento.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SubscriptionPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Institucional"
      title="Política de Assinatura e Cancelamento"
      intro="A assinatura é o que dá acesso ao Universo Atípico. Aqui explicamos, sem letras miúdas, como funciona a cobrança, a renovação e o cancelamento."
    >
      <LegalSection title="1. Plano e preço">
        <p>
          O Universo Atípico funciona com um único plano: R$ 49,90 por mês. Enquanto a assinatura
          estiver ativa, você tem acesso completo à plataforma — conteúdos, materiais, jornadas e
          comunidade.
        </p>
      </LegalSection>

      <LegalSection title="2. Cobrança e renovação">
        <LegalList
          items={[
            "A cobrança é mensal e recorrente, feita automaticamente no mesmo dia do ciclo contratado.",
            "O pagamento é processado pelo Stripe; os dados do cartão ficam com o processador, não conosco.",
            "Se um pagamento falhar, o processador pode tentar novamente. Persistindo a falha, o acesso é suspenso até a regularização.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Cancelamento">
        <LegalList
          items={[
            "Você pode cancelar quando quiser, pela área “Minha assinatura” dentro da plataforma.",
            "O cancelamento interrompe as cobranças futuras; não há multa nem fidelidade.",
            "O acesso permanece disponível até o fim do período já pago.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Direito de arrependimento">
        <p>
          Por se tratar de contratação à distância, você pode desistir em até 7 dias corridos a
          partir da contratação, conforme o artigo 49 do Código de Defesa do Consumidor, com
          devolução do valor pago no período. Basta solicitar pelo canal de atendimento.
        </p>
      </LegalSection>

      <LegalSection title="5. Reembolsos após o prazo de arrependimento">
        <p>
          Após esse prazo, as mensalidades já cobradas não são reembolsadas, salvo em caso de erro
          de cobrança ou indisponibilidade prolongada do serviço atribuível à plataforma. Nesses
          casos, avalie conosco pelo atendimento e faremos o acerto devido.
        </p>
      </LegalSection>

      <LegalSection title="6. Mudanças de preço">
        <p>
          Se o valor da assinatura for alterado no futuro, avisaremos com antecedência antes de a
          mudança valer para o seu ciclo, e você poderá cancelar antes da nova cobrança.
        </p>
      </LegalSection>

      <LegalSection title="7. Reativação">
        <p>
          Cancelou e quer voltar? Basta assinar novamente pela plataforma; seu histórico de conta
          continua disponível.
        </p>
      </LegalSection>

      <LegalSection title="Informações a preencher">
        <LegalList
          items={[
            "E-mail e horário do canal oficial de atendimento para reembolso e cancelamento.",
            "Prazo interno de resposta para solicitações de reembolso.",
            "Razão social e CNPJ do responsável pela cobrança, como aparece na fatura.",
          ]}
        />
      </LegalSection>
    </LegalLayout>
  );
}
