import { trpc } from "@/lib/trpc";
import { Loader2, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { Link, useRoute } from "wouter";

export default function ProductRedirect() {
  const [, params] = useRoute("/produto/:slug");
  const resolve = trpc.community.products.resolve.useMutation();
  const search = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const origin = search.get("origem") === "client" ? "client" : "public";
  const campaign = search.get("campanha");

  useEffect(() => {
    if (!params?.slug || resolve.isPending || resolve.isSuccess || resolve.isError) return;
    resolve.mutate({ slug: params.slug, origin, campaign });
  }, [campaign, origin, params?.slug, resolve]);
  useEffect(() => { if (resolve.data?.externalUrl) window.location.replace(resolve.data.externalUrl); }, [resolve.data?.externalUrl]);

  return <div className="page-texture grid min-h-screen place-items-center bg-[var(--paper)] px-5"><div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8 text-center shadow-[0_22px_70px_rgba(57,78,68,.1)]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--sage-pale)] text-[var(--sage-deep)]"><ShoppingBag size={22} /></span>{resolve.isError ? <><h1 className="display-font mt-6 text-3xl font-semibold">Esta seleção não está disponível.</h1><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">O link pode ter mudado ou deixou de ser publicado.</p><Link href="/"><span className="mt-6 inline-block text-sm font-extrabold text-[var(--sage-deep)] hover:underline">Voltar ao Universo Atípico</span></Link></> : <><h1 className="display-font mt-6 text-3xl font-semibold">Você está indo para um site externo.</h1><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Estamos abrindo a página indicada. Consulte as condições diretamente no destino.</p><Loader2 size={19} className="mx-auto mt-6 animate-spin text-[var(--sage-deep)]" /></>}</div></div>;
}
