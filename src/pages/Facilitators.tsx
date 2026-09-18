import Storefront from "./Storefront";

/**
 * Compatibilidade temporária para imports legados. A rota pública antiga
 * redireciona para a mesma loja e não mantém uma segunda experiência.
 */
export default function Facilitators() {
  return <Storefront members />;
}
