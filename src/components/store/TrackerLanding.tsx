import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  KeyRound,
  Backpack,
  PencilRuler,
  Check,
  MessageCircle,
} from "lucide-react";
import "./tracker-landing.css";

export const trackerSlug = "rastreador-inteligente-infantil";
export const trackerTitle = "Rastreador Universo Atípico — tag para objetos";
export const trackerSummary =
  "Chaves, bolsa, estojo: os pequenos objetos fazem parte dos grandes planos do dia. Conheça uma tag compacta para integrar à sua rotina de organização.";
const reviews = [
  [
    "Gabriel Carvalho",
    "Coloquei no chaveiro porque vivo esquecendo onde deixo as chaves em casa. Na primeira vez que precisei, consegui encontrá-las sem revirar a sala inteira. Pequeno e prático para a minha rotina.",
  ],
  [
    "Mariana Alves",
    "Pela foto, achei que fosse maior. Coube direitinho no bolso interno da minha bolsa e não ficou fazendo volume. Gostei do tamanho discreto e do acabamento simples.",
  ],
  [
    "Rafael Mendes",
    "Consegui configurar e conectar ao celular sem dificuldade, mesmo sendo a primeira vez que uso uma tag dessas. Fiz alguns testes em casa e achei o funcionamento bem intuitivo. Gostei bastante da facilidade de usar, foi uma ótima compra!",
  ],
  [
    "Juliana Rocha",
    "Comprei para o meu pai, que sempre sai procurando as chaves na hora de ir embora. Expliquei como usar e ele pegou o jeito. Foi um presente simples, mas que acabou sendo bem útil no dia a dia dele.",
  ],
  [
    "Felipe Barbosa",
    "Recebi a encomenda bem embalada e a tag veio sem marcas ou riscos. Fiz um teste rápido e funcionou como eu esperava. Ainda é cedo para comentar sobre a bateria; vou observar com mais tempo de uso.",
  ],
  [
    "Camila Duarte",
    "Prendi no estojo que levo para a faculdade, porque costumo deixar minhas coisas espalhadas entre a mochila e a mesa de estudos. A argola facilitou bastante. Até agora, estou satisfeita com a praticidade.",
  ],
  [
    "Bruno Azevedo",
    "O que mais gostei foi poder carregar junto das chaves sem ficar pesado. Para o uso que faço, atendeu bem.",
  ],
];

export function TrackerIntro() {
  return (
    <header className="tracker-intro">
      <div>
        <p className="tracker-eyebrow">LOJA MUNDO AZUL / ROTINA & ORGANIZAÇÃO</p>
        <h2>
          Menos “onde eu deixei?”.
          <br />
          <em>Mais espaço para o seu dia.</em>
        </h2>
        <p>
          Uma pequena tag. Diferentes jeitos de fazer parte da rotina.
          <br className="tracker-desktop-break" /> Explore o produto, conheça os relatos e escolha
          com informação.
        </p>
        <a href="#tracker-offer" className="tracker-intro-link">
          Conhecer o rastreador <ArrowDown size={18} />
        </a>
      </div>
      <div className="tracker-intro-note">
        <span>NO SEU DIA A DIA</span>
        <strong>
          Chaves.
          <br />
          Bolsa.
          <br />
          Estojo.
        </strong>
        <p>Os objetos que acompanham você.</p>
      </div>
    </header>
  );
}

export function TrackerOfferNotes() {
  return (
    <div className="tracker-offer-notes">
      <p>
        <Check size={17} aria-hidden="true" /> Escolha sua cor abaixo
      </p>
      <p>
        <Check size={17} aria-hidden="true" /> Conheça os relatos de uso
      </p>
      <a href="#tracker-faq">
        Confira a compatibilidade antes de comprar <ArrowDown size={15} />
      </a>
    </div>
  );
}

/** A successful HEAD must report actual video bytes, not an SPA's HTML fallback. */
function TrackerVideo({ poster }: { poster?: string }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = "/videos/rastreador-demonstracao.mp4";
  useEffect(() => {
    const controller = new AbortController();
    fetch(src, { method: "HEAD", signal: controller.signal })
      .then((r) => {
        if (r.ok && /^video\//i.test(r.headers.get("content-type") || "")) setReady(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!ready || failed)
    return (
      <section className="tracker-video-pending" aria-labelledby="tracker-video-title">
        <span className="tracker-eyebrow">VEJA ANTES DE ESCOLHER</span>
        <h2 id="tracker-video-title">O produto em ação, sem atalhos.</h2>
        <p>
          A demonstração em vídeo ainda não está disponível. Enquanto isso, explore as imagens e os
          relatos de uso abaixo.
        </p>
        <a href="#tracker-reviews">
          Ler experiências de clientes <ArrowDown size={17} />
        </a>
      </section>
    );
  return (
    <section className="tracker-video" aria-labelledby="tracker-video-title">
      <p className="tracker-eyebrow">DE PERTO, NA PRÁTICA</p>
      <h2 id="tracker-video-title">Veja como funciona.</h2>
      <video
        controls
        playsInline
        preload="none"
        poster={poster}
        onError={() => setFailed(true)}
        aria-label="Demonstração real da tag para objetos"
      >
        <source src={src} type="video/mp4" />
        Seu navegador não suporta este vídeo.
      </video>
    </section>
  );
}

export function TrackerSections({ poster }: { poster?: string }) {
  return (
    <div className="tracker-landing-sections">
      <section className="tracker-uses" aria-labelledby="tracker-uses-title">
        <div className="tracker-section-heading">
          <p className="tracker-eyebrow">PEQUENOS OBJETOS. ROTINAS REAIS.</p>
          <h2 id="tracker-uses-title">Onde ela entra no seu dia?</h2>
          <p>Três usos mencionados nos relatos de clientes.</p>
        </div>
        <div className="tracker-use-grid">
          {[
            [
              KeyRound,
              "01",
              "Junto das chaves",
              "Gabriel conta que colocou a tag no chaveiro e encontrou as chaves sem revirar a sala.",
            ],
            [
              Backpack,
              "02",
              "Dentro da bolsa",
              "Mariana destaca o tamanho discreto: a tag coube no bolso interno da bolsa.",
            ],
            [
              PencilRuler,
              "03",
              "No estojo de estudos",
              "Camila usou a argola para prender a tag ao estojo que leva para a faculdade.",
            ],
          ].map(([Icon, number, title, text]) => {
            const UseIcon = Icon as typeof KeyRound;
            return (
              <article key={String(number)}>
                <div>
                  <UseIcon size={30} aria-hidden="true" />
                  <span>{String(number)}</span>
                </div>
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="tracker-steps" aria-labelledby="tracker-steps-title">
        <div>
          <p className="tracker-eyebrow">ANTES DO PRIMEIRO USO</p>
          <h2 id="tracker-steps-title">Uma escolha simples começa com informação.</h2>
          <p>
            O funcionamento depende do modelo e do celular. Confira esses pontos antes de começar.
          </p>
          <a className="store-secondary" href="#tracker-faq">
            Tirar minhas dúvidas <ArrowDown size={18} />
          </a>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Confira a compatibilidade</h3>
              <p>Confirme com o vendedor o modelo, o aplicativo e os celulares compatíveis.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Escolha o objeto</h3>
              <p>Defina onde vai usar a tag e confira a forma de fixação indicada para ela.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Configure e teste por perto</h3>
              <p>
                Siga o manual do modelo recebido. Teste as funções disponíveis antes de incorporá-lo
                à rotina.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <TrackerVideo poster={poster} />
      <section
        id="tracker-reviews"
        className="tracker-reviews"
        aria-labelledby="tracker-reviews-title"
      >
        <div className="tracker-section-heading">
          <p className="tracker-eyebrow">EXPERIÊNCIAS DE CLIENTES</p>
          <h2 id="tracker-reviews-title">A rotina, nas palavras de quem usa.</h2>
          <p>Relatos individuais sobre tamanho, praticidade e uso no dia a dia.</p>
        </div>
        <div className="tracker-review-grid">
          {reviews.map(([name, text]) => (
            <figure key={name}>
              <MessageCircle size={22} aria-hidden="true" />
              <blockquote>{text}</blockquote>
              <figcaption>
                <span aria-hidden="true">
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <strong>{name}</strong>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section id="tracker-faq" className="tracker-faq" aria-labelledby="tracker-faq-title">
        <div>
          <p className="tracker-eyebrow">ESCOLHA COM CLAREZA</p>
          <h2 id="tracker-faq-title">
            Antes de levar
            <br />
            para a sua rotina.
          </h2>
        </div>
        <div>
          {[
            [
              "É um rastreador de crianças em tempo real?",
              "Esta página apresenta uma tag para objetos. Não há comprovação de localização de crianças em tempo real, monitoramento ao vivo ou localização garantida. Ela não substitui a supervisão de adultos.",
            ],
            [
              "Usa Bluetooth ou GPS? Qual é o alcance?",
              "A tecnologia e o alcance deste modelo ainda precisam ser confirmados pelo vendedor. Não considere este produto um GPS independente nem conte com localização a qualquer distância.",
            ],
            [
              "Qual aplicativo usa? Funciona no meu celular?",
              "O aplicativo e a compatibilidade com iPhone ou Android precisam ser confirmados para o modelo vendido. Confira essas informações com o vendedor antes da compra.",
            ],
            [
              "Quanto dura a bateria?",
              "A duração, o tipo de bateria e a possibilidade de troca ainda não foram confirmados. Consulte o manual do modelo e o vendedor.",
            ],
            [
              "Como finalizo a compra?",
              "Escolha sua variação e use Comprar agora. O pagamento é concluído no site de destino, onde você confirma preço, cor, quantidade, frete e prazo. Adicionar à seleção guarda o produto no carrinho da loja e não finaliza uma compra.",
            ],
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="tracker-final">
        <div>
          <p className="tracker-eyebrow">UM LUGAR NA SUA ROTINA</p>
          <h2>
            Qual objeto vai
            <br />
            acompanhar você?
          </h2>
          <p>Confira os detalhes, escolha a cor e veja as condições de compra.</p>
        </div>
        <a className="store-primary" href="#tracker-purchase">
          Escolher minha tag <ArrowUpRight size={20} />
        </a>
      </section>
    </div>
  );
}
