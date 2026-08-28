import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalList, LegalSection } from "@/components/LegalLayout";

export const Route = createFileRoute("/aviso-de-responsabilidade")({
  component: DisclaimerPage,
  head: () => ({
    meta: [
      { title: "Aviso de Responsabilidade e Natureza dos Conteúdos — Universo Atípico" },
      {
        name: "description",
        content:
          "Os conteúdos do Universo Atípico são informativos e educacionais e não substituem avaliação, diagnóstico ou acompanhamento de profissionais habilitados.",
      },
      {
        property: "og:title",
        content: "Aviso de Responsabilidade e Natureza dos Conteúdos — Universo Atípico",
      },
      {
        property: "og:description",
        content:
          "Os conteúdos do Universo Atípico são informativos e educacionais e não substituem avaliação, diagnóstico ou acompanhamento de profissionais habilitados.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DisclaimerPage() {
  return (
    <LegalLayout
      eyebrow="Institucional"
      title="Aviso de Responsabilidade e Natureza dos Conteúdos"
      intro="Queremos ser transparentes sobre o que o Universo Atípico é — e sobre o que ele não é. Este aviso explica, com clareza e sem alarde, como interpretar os conteúdos e as experiências compartilhadas aqui."
    >
      <LegalSection title="Conteúdo informativo e educacional">
        <p>
          Tudo o que disponibilizamos — guias, textos, vídeos, jornadas, receitas, materiais de
          apoio e conversas — tem finalidade informativa e educacional. A proposta é ampliar
          repertório, organizar informações e oferecer companhia para o dia a dia.
        </p>
      </LegalSection>

      <LegalSection title="O que os conteúdos não são">
        <LegalList
          items={[
            "Não são diagnóstico, prescrição, terapia ou tratamento individualizado.",
            "Não são um plano clínico, pedagógico ou terapêutico feito para o seu caso específico.",
            "Não substituem avaliação, acompanhamento ou orientação de profissionais habilitados.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Experiências compartilhadas">
        <p>
          Relatos de famílias e membros da comunidade descrevem trajetórias individuais. Cada
          pessoa, cada família e cada contexto são diferentes: o que funcionou para alguém não
          garante o mesmo resultado para outra pessoa. Leia esses relatos como inspiração e troca,
          não como recomendação técnica.
        </p>
      </LegalSection>

      <LegalSection title="Informação científica e referências">
        <p>
          Quando um conteúdo apresentar informação científica ou referência técnica, ela será
          apresentada de forma identificável, indicando a fonte. Conteúdos sem referência científica
          expressam experiência prática, opinião ou vivência — e não devem ser lidos como consenso
          científico nem como recomendação clínica baseada em evidências.
        </p>
      </LegalSection>

      <LegalSection title="Decisões de saúde, desenvolvimento e educação">
        <p>
          Para decisões sobre saúde, desenvolvimento, educação, terapias, alimentação, medicação ou
          tratamento, procure profissionais habilitados que conheçam o contexto da sua família.
          Nunca interrompa ou altere um acompanhamento profissional com base apenas em conteúdos
          desta plataforma. Em situações de urgência, busque atendimento imediato.
        </p>
      </LegalSection>

      <LegalSection title="Nada de promessas">
        <p>
          O Universo Atípico não promete cura, resultado garantido, evolução em prazo determinado ou
          benefício individual assegurado. O que oferecemos é conhecimento organizado, recursos
          úteis e uma comunidade que caminha junto.
        </p>
      </LegalSection>

      <LegalSection title="Recomendações e conteúdos de terceiros">
        <p>
          Quando indicarmos um material, produto ou página externa, isso será informado de forma
          clara. A decisão de acessar, contratar ou aplicar qualquer sugestão é sempre sua, e o
          conteúdo de terceiros permanece sob responsabilidade de quem o publica.
        </p>
      </LegalSection>

      <LegalSection title="Fale com a gente">
        <p>
          Se algum conteúdo parecer confuso, impreciso ou desatualizado, avise pelos canais da
          plataforma. Revisar com cuidado faz parte do nosso compromisso.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
