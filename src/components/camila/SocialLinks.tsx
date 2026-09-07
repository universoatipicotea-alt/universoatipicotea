import type { ComponentType } from "react";
import { Camera, MessageCircle, Music2, UsersRound } from "lucide-react";
import type { CamilaLinkEvent } from "@/config/camilaPublicLinks";
import { emitCamilaLinkEvent } from "@/lib/publicLinkEvents";

type SocialLink = {
  label: string;
  href: string;
  event: CamilaLinkEvent;
};

const socialIcons: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Instagram: Camera,
  WhatsApp: MessageCircle,
  TikTok: Music2,
  Facebook: UsersRound,
};

const socialColors: Record<string, string> = {
  Instagram: "bg-[#f7e6f1] text-[#c72b76]",
  WhatsApp: "bg-[#e1f7ea] text-[#168f52]",
  TikTok: "bg-[#17233a] text-white",
  Facebook: "bg-[#e4efff] text-[#2374d8]",
};

export function SocialLinks({ links }: { links: readonly SocialLink[] }) {
  return (
    <nav aria-label="Redes sociais da Camila" className="mt-7 flex justify-center gap-3">
      {links.map((link) => {
        const Icon = socialIcons[link.label] ?? MessageCircle;
        return (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${link.label} da Camila Ribeiro`}
            data-analytics-event={link.event}
            onClick={() => emitCamilaLinkEvent(link.event)}
            className={`grid h-12 w-12 place-items-center rounded-2xl border border-white/80 shadow-[0_8px_18px_rgba(8,31,77,.07)] transition hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(8,31,77,.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#69bce6]/35 active:scale-95 ${socialColors[link.label] ?? "bg-white text-[#082c62]"}`}
          >
            <Icon size={21} strokeWidth={2} />
          </a>
        );
      })}
    </nav>
  );
}
