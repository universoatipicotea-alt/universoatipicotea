/**
 * Camada de compatibilidade: mantém a API do wouter usada nas páginas
 * originais, mas roteando com o TanStack Router.
 */
import { Link as RouterLink, useRouter, useRouterState } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

export function Link({ href, children, ...rest }: LinkProps) {
  if (/^https?:|^mailto:|^#/.test(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  const [pathname, search] = href.split("?");
  return (
    <RouterLink
      to={pathname as never}
      search={search ? (Object.fromEntries(new URLSearchParams(search)) as never) : undefined}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </RouterLink>
  );
}

export function useLocation(): [string, (to: string) => void] {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = (to: string) => {
    if (/^https?:/.test(to)) {
      window.location.href = to;
      return;
    }
    const [path, search] = to.split("?");
    void router.navigate({
      to: path as never,
      search: search ? (Object.fromEntries(new URLSearchParams(search)) as never) : undefined,
    });
  };
  return [pathname, navigate];
}

export function useSearch(): string {
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  return searchStr?.replace(/^\?/, "") ?? "";
}

export function useRoute(pattern: string): [boolean, Record<string, string> | null] {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const keys: string[] = [];
  const regex = new RegExp(
    `^${pattern.replace(/:[A-Za-z0-9_]+/g, (match) => {
      keys.push(match.slice(1));
      return "([^/]+)";
    })}/?$`,
  );
  const match = regex.exec(pathname);
  if (!match) return [false, null];
  const params: Record<string, string> = {};
  keys.forEach((key, index) => {
    params[key] = decodeURIComponent(match[index + 1] ?? "");
  });
  return [true, params];
}
