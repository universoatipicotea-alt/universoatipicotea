import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  ArrowUpRight,
  Plus,
  Minus,
  UserRound,
  ZoomIn,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { MemberShell } from "@/components/MemberShell";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { call } from "@/lib/trpc";
import {
  effectivePrice,
  formatMoney,
  type StoreProduct,
  type StoreCollection,
  type StoreSettings,
} from "@shared/store";
import "./store.css";

type CartItem = { id: number; variant: string; quantity: number };
type Catalog = {
  products: StoreProduct[];
  collections: StoreCollection[];
  hasMore: boolean;
  missingCollection: boolean;
};
type Home = {
  collections: StoreCollection[];
  settings: StoreSettings;
  groups: Record<string, StoreProduct[]>;
};
const root = "/lojamundoazul";
const memberQuery = (members: boolean) => (members ? "?membros=1" : "");
const productUrl = (p: StoreProduct, members: boolean) =>
  `${root}/produto/${p.slug}${memberQuery(members)}`;
const collectionUrl = (c: StoreCollection, members: boolean) =>
  `${root}/colecao/${c.slug}${memberQuery(members)}`;
function useStoreQuery<T>(path: string, input: unknown, enabled = true) {
  return useQuery({
    queryKey: [path, input],
    queryFn: () => call(path, input) as Promise<T>,
    enabled,
  });
}
function Price({ product: p }: { product: StoreProduct }) {
  return (
    <div className="store-price">
      {p.salePriceCents !== null && p.priceCents !== null && <del>{formatMoney(p.priceCents)}</del>}
      <strong>{formatMoney(effectivePrice(p))}</strong>
    </div>
  );
}
function Picture({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return src ? (
    <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
  ) : (
    <div className="store-placeholder">Imagem em preparação</div>
  );
}
function ProductCard({ p, members }: { p: StoreProduct; members: boolean }) {
  return (
    <article className="store-card">
      <a href={productUrl(p, members)}>
        <div className="store-card-photo">
          <Picture src={p.imageUrl} alt={p.title} />
          {p.shopDetails.badge && <span className="store-badge">{p.shopDetails.badge}</span>}
        </div>
        <h3>{p.title}</h3>
        <Price product={p} />
        <span className="store-text-link">
          Ver produto <ArrowUpRight size={15} />
        </span>
      </a>
    </article>
  );
}
function ProductGroup({
  title,
  items,
  members,
}: {
  title: string;
  items: StoreProduct[];
  members: boolean;
}) {
  if (!items.length) return null;
  return (
    <section className="store-section">
      <h2>{title}</h2>
      <div className="store-grid">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} members={members} />
        ))}
      </div>
    </section>
  );
}
function UniverseBlock() {
  return (
    <aside className="store-universe">
      <span>UM ECOSSISTEMA DE CONHECIMENTO E ACOLHIMENTO</span>
      <h2>Este produto faz parte do Universo Atípico.</h2>
      <p>Conheça também a comunidade, a Academia Atípica e os conteúdos da plataforma.</p>
      <div className="store-actions">
        <a href="/comunidade">Conhecer a Comunidade</a>
        <a href="/academia">Conhecer a Academia Atípica</a>
      </div>
    </aside>
  );
}
function Quantity({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="store-quantity">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={value >= 99}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function Storefront({
  members: memberProp = false,
  slug,
  collection,
}: {
  members?: boolean;
  slug?: string;
  collection?: string;
}) {
  const members =
    memberProp ||
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("membros") === "1");
  const requestedSearch =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("busca")?.slice(0, 120) || ""
      : "";
  const [search, setSearch] = useState(requestedSearch);
  const [draftSearch, setDraftSearch] = useState(requestedSearch);
  const [category, setCategory] = useState<number | null>(null);
  const [sort, setSort] = useState("recommended");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const cartKey = `ua-mundo-azul-selection-${members ? "member" : "public"}`;
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(cartKey) ?? "[]");
      setCart(
        Array.isArray(raw)
          ? raw
              .filter(
                (i) =>
                  Number.isSafeInteger(i.id) &&
                  i.id > 0 &&
                  typeof i.variant === "string" &&
                  i.variant.length <= 100 &&
                  Number.isInteger(i.quantity) &&
                  i.quantity > 0 &&
                  i.quantity <= 99,
              )
              .slice(0, 50)
          : [],
      );
    } catch {
      setCart([]);
    }
    setReady(true);
  }, [cartKey]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(cartKey, JSON.stringify(cart));
      } catch {
        /* The selection still works when storage is unavailable. */
      }
  }, [cart, cartKey, ready]);
  const home = useStoreQuery<Home>("store.home", { members });
  const catalog = useStoreQuery<Catalog>(
    "store.catalog",
    { members, search, category, sort, page, collection: collection ?? "" },
    !slug,
  );
  const cartProducts = useStoreQuery<StoreProduct[]>(
    "store.cart",
    { members, ids: [...new Set(cart.map((i) => i.id))] },
    cartOpen,
  );
  const collections = home.data?.collections ?? [];
  const selectedCollection = collections.find((c) => c.slug === collection);
  function add(p: StoreProduct, variant: string, quantity: number) {
    setCart((items) => {
      const found = items.find((i) => i.id === p.id && i.variant === variant);
      return found
        ? items.map((i) =>
            i === found ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i,
          )
        : items.length < 50
          ? [...items, { id: p.id, variant, quantity }]
          : items;
    });
    setCartOpen(true);
  }
  const filtersForm = (
    <div className="store-filter-fields">
      <label>
        Categoria
        <select
          value={category ?? ""}
          onChange={(e) => {
            setCategory(e.target.value ? Number(e.target.value) : null);
            setPage(1);
          }}
        >
          <option value="">Todas as categorias</option>
          {collections
            .filter((c) => c.kind === "category")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Ordenar por
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="recommended">Recomendados</option>
          <option value="newest">Mais recentes</option>
          <option value="price-low">Menor preço</option>
          <option value="price-high">Maior preço</option>
        </select>
      </label>
      <button
        type="button"
        onClick={() => {
          setCategory(null);
          setSort("recommended");
          setPage(1);
          setSearch("");
          setDraftSearch("");
        }}
      >
        Limpar filtros
      </button>
    </div>
  );
  const content = (
    <div className="store-shell">
      {home.data?.settings.promotion && (
        <div className="store-promotion">{home.data.settings.promotion}</div>
      )}
      <header className="store-header">
        <div className="store-header-main">
          <a href={members ? `${root}/membros` : root} className="store-brand">
            <Brand compact linked={false} />
            <span>Loja Mundo Azul</span>
          </a>
          <form
            className="store-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (slug) {
                window.location.href = `${members ? `${root}/membros` : root}?busca=${encodeURIComponent(draftSearch)}`;
                return;
              }
              setSearch(draftSearch);
              setPage(1);
              document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <label className="sr-only" htmlFor="store-search">
              Buscar produtos
            </label>
            <input
              id="store-search"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="O que você procura?"
              maxLength={120}
            />
            <button aria-label="Buscar">
              <Search size={21} />
            </button>
          </form>
          <a className="store-icon" href="/inicio" aria-label="Minha conta">
            <UserRound />
            <span>Conta</span>
          </a>
          <button
            className="store-icon"
            onClick={() => setCartOpen(true)}
            aria-label={`Carrinho, ${cart.length} seleções`}
          >
            <ShoppingBag />
            <span>Carrinho ({cart.length})</span>
          </button>
        </div>
        <nav className="store-nav" aria-label="Categorias da loja">
          <details>
            <summary>Categorias e coleções</summary>
            <div className="store-megamenu">
              {collections.map((c) => (
                <a key={c.id} href={collectionUrl(c, members)}>
                  {c.name}
                </a>
              ))}
              {!collections.length && <p>As coleções estão sendo preparadas.</p>}
            </div>
          </details>
          <a href={members ? `${root}/membros` : root}>Todos os produtos</a>
          {collections
            .filter((c) => c.featured)
            .slice(0, 3)
            .map((c) => (
              <a className="store-nav-feature" key={c.id} href={collectionUrl(c, members)}>
                {c.name}
              </a>
            ))}
        </nav>
      </header>
      <main className="store-main">
        {slug ? (
          <ProductDetail slug={slug} members={members} onAdd={add} />
        ) : (
          <>
            {!collection && !search && !category && home.data && (
              <>
                <section
                  className={`store-hero ${home.data.settings.heroImage ? "has-image" : ""}`}
                >
                  <div>
                    <span>UNIVERSO ATÍPICO · LOJA MUNDO AZUL</span>
                    <h1>{home.data.settings.heroTitle}</h1>
                    <p>{home.data.settings.heroDescription}</p>
                    <a
                      className="store-primary"
                      href={
                        collections.find((c) => c.id === home.data?.settings.heroCollectionId)
                          ? collectionUrl(
                              collections.find(
                                (c) => c.id === home.data?.settings.heroCollectionId,
                              )!,
                              members,
                            )
                          : "#catalogo"
                      }
                    >
                      Explorar a seleção <ArrowUpRight size={18} />
                    </a>
                    <div className="store-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  {home.data.settings.heroImage && (
                    <Picture
                      src={home.data.settings.heroImage}
                      alt="Seleção da Loja Mundo Azul"
                      priority
                    />
                  )}
                </section>
                {[
                  ["featured", "Em destaque"],
                  ["bestseller", "Mais vendidos"],
                  ["isNew", "Novidades"],
                  ["kit", "Kits para o cotidiano"],
                ].map(([key, title]) => (
                  <ProductGroup
                    key={key}
                    title={title}
                    items={home.data!.groups[key] ?? []}
                    members={members}
                  />
                ))}
                <div className="store-editorials">
                  {home.data.settings.editorial.map((b, i) => (
                    <article key={i}>
                      {b.imageUrl && <Picture src={b.imageUrl} alt={b.title} />}
                      <div>
                        <h2>{b.title}</h2>
                        <p>{b.description}</p>
                        {collections.find((c) => c.id === b.collectionId) && (
                          <a
                            href={collectionUrl(
                              collections.find((c) => c.id === b.collectionId)!,
                              members,
                            )}
                          >
                            Ver coleção →
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
            <section id="catalogo" className="store-section">
              <div className="store-section-heading">
                <div>
                  <span>ESCOLHAS PARA O DIA A DIA</span>
                  <h1>
                    {selectedCollection?.name ??
                      (search ? `Resultados para “${search}”` : "Explore a loja")}
                  </h1>
                  {selectedCollection?.description && <p>{selectedCollection.description}</p>}
                </div>
                <button className="store-mobile-filter" onClick={() => setFilters(true)}>
                  <SlidersHorizontal size={18} /> Filtrar e ordenar
                </button>
              </div>
              {selectedCollection?.imageUrl && (
                <div className="store-collection-image">
                  <Picture src={selectedCollection.imageUrl} alt={selectedCollection.name} />
                </div>
              )}
              <div className="store-desktop-filter">{filtersForm}</div>
              {catalog.isPending ? (
                <p role="status">Carregando produtos…</p>
              ) : catalog.isError ? (
                <div role="alert">
                  <p>Não foi possível carregar a loja.</p>
                  <button onClick={() => catalog.refetch()}>Tentar novamente</button>
                </div>
              ) : catalog.data?.missingCollection ? (
                <p>Esta coleção não está disponível.</p>
              ) : catalog.data?.products.length ? (
                <div className="store-grid">
                  {catalog.data.products.map((p) => (
                    <ProductCard key={p.id} p={p} members={members} />
                  ))}
                </div>
              ) : (
                <p className="store-empty">
                  Nenhum produto encontrado nesta seleção. Experimente outra categoria ou volte em
                  breve.
                </p>
              )}
              {(page > 1 || catalog.data?.hasMore) && (
                <nav className="store-pagination" aria-label="Paginação dos produtos">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Anterior
                  </button>
                  <span>Página {page}</span>
                  <button disabled={!catalog.data?.hasMore} onClick={() => setPage(page + 1)}>
                    Próxima
                  </button>
                </nav>
              )}
            </section>
            <UniverseBlock />
          </>
        )}
      </main>
      <footer className="store-footer">
        <strong>Universo Atípico · Loja Mundo Azul</strong>
        <p>
          Compras realizadas em sites parceiros. Preço, estoque, entrega e condições são confirmados
          no destino.
        </p>
        <a href="/">Conhecer o Universo Atípico</a>
      </footer>
      <Dialog open={filters} onOpenChange={setFilters}>
        <DialogContent className="store-dialog store-filter-drawer">
          <DialogTitle>Filtrar e ordenar</DialogTitle>
          <DialogDescription>Encontre os produtos da sua seleção.</DialogDescription>
          {filtersForm}
          <button className="store-primary" onClick={() => setFilters(false)}>
            Ver resultados
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="store-dialog">
          <DialogTitle>Seu carrinho de seleção</DialogTitle>
          <DialogDescription>
            Uma lista para organizar suas escolhas. A compra de cada produto acontece no site
            parceiro. Quantidades não são enviadas automaticamente.
          </DialogDescription>
          {cartProducts.isPending ? (
            <p>Consultando produtos…</p>
          ) : cartProducts.isError ? (
            <p role="alert">
              Não foi possível atualizar preços e disponibilidade. Feche e tente novamente.
            </p>
          ) : cart.length ? (
            cart.map((item, index) => {
              const p = cartProducts.data?.find((p) => p.id === item.id);
              const variant = p?.shopDetails.variants.find((v) => v.label === item.variant);
              const available =
                p &&
                p.shopDetails.availability !== "unavailable" &&
                (!item.variant || variant?.available);
              const url = variant?.url || p?.linkUrl;
              return (
                <article className="store-cart-item" key={`${item.id}-${item.variant}`}>
                  <h3>
                    {p?.title ?? "Produto não disponível nesta vitrine"}
                    {item.variant && ` · ${item.variant}`}
                  </h3>
                  {p && <Price product={p} />}
                  <Quantity
                    value={item.quantity}
                    onChange={(quantity) =>
                      setCart((items) =>
                        items.map((i, n) => (n === index ? { ...i, quantity } : i)),
                      )
                    }
                  />
                  <button onClick={() => setCart((items) => items.filter((_, n) => n !== index))}>
                    Remover
                  </button>
                  {available && url ? (
                    <a
                      className="store-primary"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Comprar no parceiro <ArrowUpRight size={16} />
                    </a>
                  ) : (
                    <p>Compra indisponível. Confira outra seleção.</p>
                  )}
                </article>
              );
            })
          ) : (
            <p>Seu carrinho está vazio. Explore os produtos e salve suas escolhas aqui.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
  return members ? (
    <MemberShell
      eyebrow="Loja Mundo Azul"
      title="Sua seleção, no mesmo universo"
      description="Produtos e recursos para o cotidiano."
    >
      {content}
    </MemberShell>
  ) : (
    content
  );
}

function ProductDetail({
  slug,
  members,
  onAdd,
}: {
  slug: string;
  members: boolean;
  onAdd: (p: StoreProduct, v: string, q: number) => void;
}) {
  const query = useStoreQuery<{
    product: StoreProduct;
    related: StoreProduct[];
    complementary: StoreProduct[];
  } | null>("store.product", { slug, members });
  const [imageIndex, setImageIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variantIndex, setVariantIndex] = useState(0);
  if (query.isPending) return <p role="status">Carregando produto…</p>;
  if (query.isError)
    return (
      <div role="alert">
        <p>Não foi possível abrir este produto.</p>
        <button onClick={() => query.refetch()}>Tentar novamente</button>
      </div>
    );
  if (!query.data)
    return (
      <section className="store-empty">
        <h1>Produto não disponível</h1>
        <a href={members ? `${root}/membros` : root}>Voltar à loja</a>
      </section>
    );
  const p = query.data.product,
    d = p.shopDetails,
    images = [...new Set([p.imageUrl, ...d.gallery].filter(Boolean))],
    variant = d.variants[variantIndex],
    url = variant?.url || p.linkUrl,
    available = d.availability !== "unavailable" && (!variant || variant.available),
    purchasable = available && Boolean(url);
  return (
    <>
      <nav className="store-breadcrumb" aria-label="Navegação">
        <a href={members ? `${root}/membros` : root}>Loja Mundo Azul</a>
        <span>/</span>
        <span>{p.title}</span>
      </nav>
      <div className="store-product">
        <section aria-label="Galeria do produto">
          <button
            className="store-gallery-main"
            onClick={() => setZoom(true)}
            disabled={!images.length}
            aria-label={`Ampliar imagem de ${p.title}`}
          >
            <Picture src={images[imageIndex] ?? ""} alt={p.title} priority />
            <ZoomIn size={22} />
          </button>
          <div className="store-thumbnails">
            {images.map((src, i) => (
              <button
                key={src}
                aria-label={`Ver imagem ${i + 1}`}
                aria-pressed={i === imageIndex}
                onClick={() => setImageIndex(i)}
              >
                <Picture src={src} alt={`${p.title}, imagem ${i + 1}`} />
              </button>
            ))}
          </div>
        </section>
        <section className="store-buy">
          <span>{p.category}</span>
          <h1>{p.title}</h1>
          <Price product={p} />
          <p>{p.summary}</p>
          {d.variants.length > 0 && (
            <label>
              Variação
              <select
                value={variantIndex}
                onChange={(e) => setVariantIndex(Number(e.target.value))}
              >
                {d.variants.map((v, i) => (
                  <option key={i} value={i}>
                    {v.label}
                    {!v.available ? " — indisponível" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p>
            {!available
              ? "Indisponível"
              : d.availability === "available"
                ? "Disponível — confirme no parceiro"
                : "Consulte a disponibilidade no parceiro"}
          </p>
          <label>Quantidade na sua seleção</label>
          <Quantity value={quantity} onChange={setQuantity} />
          {purchasable ? (
            <a className="store-primary" href={url} target="_blank" rel="noopener noreferrer">
              {p.sourceLabel || "Comprar no parceiro"} <ArrowUpRight size={18} />
            </a>
          ) : (
            <button disabled className="store-primary">
              Compra indisponível
            </button>
          )}
          <button
            disabled={!purchasable}
            className="store-secondary"
            onClick={() => onAdd(p, variant?.label ?? "", quantity)}
          >
            Adicionar à seleção
          </button>
          <p className="store-purchase-note">{d.purchaseInfo}</p>
          <small>A quantidade e a variação devem ser confirmadas no site parceiro.</small>
        </section>
      </div>
      <div className="store-product-copy">
        {[
          ["Sobre o produto", d.description || p.summary],
          ["Destaques", d.highlights],
          ["Como explorar", d.usage],
          ["Detalhes", d.specifications],
          ["Cuidados", d.care],
        ]
          .filter(([, text]) => text)
          .map(([title, text]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
        <div className="store-support-images">
          {d.supportImages.filter(Boolean).map((src, i) => (
            <Picture key={src} src={src} alt={`${p.title} — detalhe ${i + 1}`} />
          ))}
        </div>
      </div>
      <ProductGroup title="Você também pode gostar" items={query.data.related} members={members} />
      <ProductGroup title="Monte seu kit" items={query.data.complementary} members={members} />
      <UniverseBlock />
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="store-dialog store-zoom">
          <DialogTitle>{p.title}</DialogTitle>
          <DialogDescription>
            Imagem {imageIndex + 1} de {images.length}
          </DialogDescription>
          <Picture src={images[imageIndex] ?? ""} alt={p.title} priority />
        </DialogContent>
      </Dialog>
    </>
  );
}
