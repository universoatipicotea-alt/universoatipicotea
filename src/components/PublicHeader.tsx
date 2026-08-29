import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Menu } from "lucide-react";
import { Brand } from "./Brand";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const NAV_ITEMS = [
  { label: "Sobre o Universo", href: "/#sobre" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Recursos", href: "/#recursos" },
  { label: "Comunidade", href: "/#comunidade" },
  { label: "Blog", href: "/#blog" },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-[#fdfcf9]/92 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-[var(--line)] shadow-[0_6px_24px_-18px_rgba(16,38,74,0.35)]"
          : "border-transparent shadow-none"
      }`}
    >
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-4 px-5 sm:px-8 lg:px-10">
        {/* Mobile: hamburger */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-xl text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/5"
                aria-label="Abrir navegação"
              >
                <Menu size={21} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] border-r border-[var(--line)] bg-[#fdfcf9] p-6"
            >
              <SheetHeader className="text-left">
                <SheetTitle>
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <nav
                className="mt-8 flex flex-col gap-1"
                aria-label="Navegação principal"
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/5"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/entrar"
                  className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/5"
                >
                  Entrar
                </Link>
              </nav>
              <Button
                asChild
                className="pressable mt-6 h-12 w-full rounded-xl bg-[var(--ink)] text-[15px] font-extrabold text-white hover:bg-[var(--sage-deep)]"
              >
                <Link href="/vsl">
                  Começar agora <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-[var(--ink-soft)]">
                R$ 49,90/mês · acesso completo
              </p>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <div className="flex min-w-0 items-center">
          <div className="hidden lg:block">
            <Brand />
          </div>
          <div className="lg:hidden">
            <Brand compact />
          </div>
        </div>

        {/* Desktop: nav central */}
        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Navegação principal"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Ações */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-3">
          <Link
            href="/entrar"
            className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:block"
          >
            Entrar
          </Link>
          <Button
            asChild
            className="pressable h-11 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_-14px_rgba(16,38,74,0.6)] transition-colors hover:bg-[var(--sage-deep)]"
          >
            <Link href="/vsl">
              Começar agora <ArrowRight size={15} className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
