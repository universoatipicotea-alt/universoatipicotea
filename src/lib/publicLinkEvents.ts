import type { CamilaLinkEvent } from "@/config/camilaPublicLinks";

export function emitCamilaLinkEvent(event: CamilaLinkEvent) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ua:public-link-click", { detail: { event } }));
  }
}
