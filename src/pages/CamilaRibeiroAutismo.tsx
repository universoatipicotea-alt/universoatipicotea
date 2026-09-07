import { Brand } from "@/components/Brand";
import { PublicLinkCard } from "@/components/camila/PublicLinkCard";
import { PublicProfileHeader } from "@/components/camila/PublicProfileHeader";
import { SocialLinks } from "@/components/camila/SocialLinks";
import { camilaPrimaryLinks, camilaProfile, camilaSocialLinks } from "@/config/camilaPublicLinks";

export default function CamilaRibeiroAutismo() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fffaf2] px-5 py-8 text-[#082c62] sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute -left-28 top-20 h-64 w-64 rounded-full bg-[#ffcc74]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-28 top-80 h-72 w-72 rounded-full bg-[#67c7bd]/20 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[720px]">
        <div className="mb-9 flex justify-center">
          <a
            href="/"
            aria-label="Ir para a página inicial do Universo Atípico"
            className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_22px_rgba(8,31,77,.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/35"
          >
            <Brand compact />
          </a>
        </div>

        <PublicProfileHeader {...camilaProfile} />
        <SocialLinks links={camilaSocialLinks} />

        <section aria-labelledby="camila-links-title" className="mt-10">
          <h1 id="camila-links-title" className="sr-only">
            Links de Camila Ribeiro Autismo
          </h1>
          <div className="grid gap-4">
            {camilaPrimaryLinks.map((link) => (
              <PublicLinkCard key={link.event} {...link} />
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-[#dfe6ee] py-7 text-center text-xs font-semibold leading-6 text-[#62748c]">
          <p className="font-extrabold text-[#082c62]">
            Mais informação. Mais inclusão. Mais possibilidades.
          </p>
          <p>Uma página de Camila Ribeiro Autismo dentro do Universo Atípico.</p>
        </footer>
      </div>
    </main>
  );
}
