import { useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { call } from "@/lib/trpc";
import {
  storeDetailsSchema,
  storeSettingsSchema,
  storeProductSchema,
  storeCollectionSchema,
  type StoreProductInput,
  type StoreProduct,
  type StoreCollection,
  type StoreSettings,
} from "@shared/store";
import "@/pages/store.css";

type AdminData = {
  products: StoreProduct[];
  collections: StoreCollection[];
  settings: StoreSettings;
  hasMore: boolean;
};
const blankProduct = (): StoreProductInput => ({
  title: "",
  slug: "",
  summary: "",
  categoryId: null,
  collectionIds: [],
  imageUrl: "",
  imageKey: null,
  linkUrl: "",
  sourceLabel: "Comprar no parceiro",
  priceCents: null,
  salePriceCents: null,
  visiblePublic: false,
  visibleMembers: true,
  status: "draft",
  position: 0,
  shopDetails: storeDetailsSchema.parse({}),
});
const blankCollection = () => ({
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  kind: "category" as "category" | "collection",
  status: "draft" as "draft" | "published",
  position: 0,
  featured: false,
});
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}
function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="store-check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
function lines(text: string) {
  return text
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}
function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string, key?: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 8 * 1024 * 1024
      )
        throw new Error("Envie JPG, PNG ou WebP de até 8 MB.");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Falha ao ler imagem."));
        reader.readAsDataURL(file);
      });
      const result = (await call("community.files.uploadContentImage", {
        fileName: file.name,
        dataUrl,
      })) as { url: string; key: string };
      onChange(result.url, result.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <fieldset>
      <legend>{label}</legend>
      {value && <img src={value} alt={`Prévia: ${label}`} />}
      <Field label="URL da imagem">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… ou /api/public/ua-image/…"
        />
      </Field>
      <Field label={busy ? "Enviando…" : "Enviar imagem"}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </Field>
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
function ImageList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      {values.map((url, i) => (
        <div key={i}>
          <ImageField
            label={`Imagem ${i + 1}`}
            value={url}
            onChange={(value) => onChange(values.map((v, n) => (n === i ? value : v)))}
          />
          <button type="button" onClick={() => onChange(values.filter((_, n) => n !== i))}>
            Remover imagem {i + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        disabled={values.length >= (label === "Galeria" ? 12 : 8)}
      >
        Adicionar imagem
      </button>
    </fieldset>
  );
}
export default function StoreAdmin() {
  const [tab, setTab] = useState("products"),
    [page, setPage] = useState(1),
    [search, setSearch] = useState("");
  const [p, setP] = useState<StoreProductInput>(blankProduct);
  const [c, setC] = useState<ReturnType<typeof blankCollection> & { id?: number }>(blankCollection);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["store.admin.catalog", { page, search }],
    queryFn: () => call("store.admin.catalog", { page, search }) as Promise<AdminData>,
  });
  const mutation = useMutation({
    mutationFn: ({ path, data }: { path: string; data: unknown }) => call(path, data),
    onSuccess: async () => {
      setMessage("Alterações salvas.");
      setError("");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["store.admin.catalog"] }),
        client.invalidateQueries({ queryKey: ["store.catalog"] }),
        client.invalidateQueries({ queryKey: ["store.home"] }),
        client.invalidateQueries({ queryKey: ["store.product"] }),
        client.invalidateQueries({ queryKey: ["store.cart"] }),
        client.invalidateQueries({ queryKey: ["community.admin.dashboard"] }),
      ]);
    },
    onError: (e: Error) => {
      setError(e.message);
      setMessage("");
    },
  });
  const update = <K extends keyof StoreProductInput>(key: K, value: StoreProductInput[K]) =>
    setP((old) => ({ ...old, [key]: value }));
  const detail = <K extends keyof StoreProductInput["shopDetails"]>(
    key: K,
    value: StoreProductInput["shopDetails"][K],
  ) => setP((old) => ({ ...old, shopDetails: { ...old.shopDetails, [key]: value } }));
  async function save(path: string, data: unknown, schema: { parse: (v: unknown) => unknown }) {
    setMessage("");
    setError("");
    try {
      await mutation.mutateAsync({ path, data: schema.parse(data) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confira os campos e tente novamente.");
    }
  }
  const s = settings ?? query.data?.settings ?? storeSettingsSchema.parse({});
  const textField = (
    key: "title" | "slug" | "summary" | "linkUrl" | "sourceLabel",
    label: string,
  ) => (
    <Field label={label}>
      <input
        value={p[key]}
        onChange={(e) => update(key, e.target.value)}
        required={key === "title" || key === "slug"}
      />
    </Field>
  );
  return (
    <div className="store-admin">
      <header>
        <h2>Loja Mundo Azul</h2>
        <p>
          Uma base única para a vitrine pública e a área de membros. Compras por links externos.
        </p>
        <a href="/lojamundoazul" target="_blank" rel="noreferrer">
          Abrir vitrine ↗
        </a>
      </header>
      <nav className="store-admin-tabs" aria-label="Gestão da loja">
        {[
          ["products", "Produtos"],
          ["collections", "Categorias e coleções"],
          ["banners", "Banners e home"],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      {query.isError && (
        <div role="alert">
          <p>
            Não foi possível carregar a gestão. Verifique se a migration da loja foi aplicada no
            ambiente de teste.
          </p>
          <button onClick={() => query.refetch()}>Tentar novamente</button>
        </div>
      )}
      {query.isPending && <p>Carregando cadastro…</p>}
      {tab === "products" && (
        <>
          <form
            className="store-admin-panel"
            onSubmit={(e) => {
              e.preventDefault();
              void save("store.admin.saveProduct", p, storeProductSchema);
            }}
          >
            <h2>{p.id ? `Editar produto #${p.id}` : "Novo produto"}</h2>
            <small>
              Editar mantém o ID, os vínculos e as imagens existentes. Publicação pública deve ser
              uma decisão explícita.
            </small>
            <div className="store-admin-grid">
              {textField("title", "Nome")}
              {textField("slug", "Slug (letras minúsculas, números e hífens)")}
              {textField("summary", "Descrição curta")}
              {textField("linkUrl", "Link HTTPS de compra no parceiro")}
              {textField("sourceLabel", "Texto do botão de compra")}
              <Field label="Ordem">
                <input
                  type="number"
                  min="0"
                  value={p.position}
                  onChange={(e) => update("position", Number(e.target.value))}
                />
              </Field>
              <Field label="Categoria">
                <select
                  value={p.categoryId ?? ""}
                  onChange={(e) =>
                    update("categoryId", e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Sem categoria</option>
                  {query.data?.collections
                    .filter((c) => c.kind === "category")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Publicação">
                <select
                  value={p.status}
                  onChange={(e) => update("status", e.target.value as "draft" | "published")}
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </Field>
              <Field label="Preço (R$; vazio para consultar no parceiro)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.priceCents === null ? "" : p.priceCents / 100}
                  onChange={(e) =>
                    update(
                      "priceCents",
                      e.target.value === "" ? null : Math.round(Number(e.target.value) * 100),
                    )
                  }
                />
              </Field>
              <Field label="Preço promocional (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.salePriceCents === null ? "" : p.salePriceCents / 100}
                  onChange={(e) =>
                    update(
                      "salePriceCents",
                      e.target.value === "" ? null : Math.round(Number(e.target.value) * 100),
                    )
                  }
                />
              </Field>
            </div>
            <Check
              label="Visível publicamente (sem login)"
              value={p.visiblePublic}
              onChange={(v) => update("visiblePublic", v)}
            />
            <Check
              label="Visível para membros"
              value={p.visibleMembers}
              onChange={(v) => update("visibleMembers", v)}
            />
            <ImageField
              label="Foto principal"
              value={p.imageUrl}
              onChange={(url, key) => {
                update("imageUrl", url);
                update("imageKey", key ?? null);
              }}
            />
            <fieldset>
              <legend>Coleções deste produto</legend>
              {query.data?.collections
                .filter((c) => c.kind === "collection")
                .map((c) => (
                  <Check
                    key={c.id}
                    label={c.name}
                    value={p.collectionIds.includes(c.id)}
                    onChange={(v) =>
                      update(
                        "collectionIds",
                        v
                          ? [...p.collectionIds, c.id]
                          : p.collectionIds.filter((id) => id !== c.id),
                      )
                    }
                  />
                ))}
            </fieldset>
            <fieldset>
              <legend>Conteúdo e informações reais</legend>
              <small>
                Não acrescente promessas médicas ou terapêuticas. Informe apenas características
                verificadas do produto.
              </small>
              {(
                [
                  ["description", "Sobre o produto"],
                  ["highlights", "Destaques"],
                  ["usage", "Como explorar"],
                  ["specifications", "Detalhes (materiais, tamanho, indicação)"],
                  ["care", "Cuidados"],
                  ["purchaseInfo", "Informações de compra"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea
                    value={p.shopDetails[key]}
                    onChange={(e) => detail(key, e.target.value)}
                  />
                </Field>
              ))}
            </fieldset>
            <div className="store-admin-grid">
              <Field label="Disponibilidade">
                <select
                  value={p.shopDetails.availability}
                  onChange={(e) =>
                    detail(
                      "availability",
                      e.target.value as "available" | "unavailable" | "consult",
                    )
                  }
                >
                  <option value="consult">Consultar no parceiro</option>
                  <option value="available">Disponível</option>
                  <option value="unavailable">Indisponível</option>
                </select>
              </Field>
              <Field label="Badge curto (opcional)">
                <input
                  value={p.shopDetails.badge}
                  onChange={(e) => detail("badge", e.target.value)}
                  maxLength={40}
                />
              </Field>
              <Field label="Tags (uma por linha)">
                <textarea
                  value={p.shopDetails.tags.join("\n")}
                  onChange={(e) => detail("tags", e.target.value.split("\n"))}
                />
              </Field>
            </div>
            <fieldset>
              <legend>Destaques da home</legend>
              {(
                [
                  ["featured", "Em destaque"],
                  ["bestseller", "Mais vendidos — marcar somente com histórico confirmado"],
                  ["isNew", "Novidade"],
                  ["kit", "Kit"],
                ] as const
              ).map(([key, label]) => (
                <Check
                  key={key}
                  label={label}
                  value={p.shopDetails[key]}
                  onChange={(v) => detail(key, v)}
                />
              ))}
            </fieldset>
            <ImageList
              label="Galeria"
              values={p.shopDetails.gallery}
              onChange={(v) => detail("gallery", v)}
            />
            <ImageList
              label="Imagens de apoio"
              values={p.shopDetails.supportImages}
              onChange={(v) => detail("supportImages", v)}
            />
            <fieldset>
              <legend>Variações</legend>
              {p.shopDetails.variants.map((v, i) => (
                <fieldset key={i}>
                  <legend>Variação {i + 1}</legend>
                  <Field label="Nome">
                    <input
                      value={v.label}
                      onChange={(e) =>
                        detail(
                          "variants",
                          p.shopDetails.variants.map((old, n) =>
                            n === i ? { ...old, label: e.target.value } : old,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Link específico (opcional)">
                    <input
                      value={v.url}
                      onChange={(e) =>
                        detail(
                          "variants",
                          p.shopDetails.variants.map((old, n) =>
                            n === i ? { ...old, url: e.target.value } : old,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Check
                    label="Disponível"
                    value={v.available}
                    onChange={(available) =>
                      detail(
                        "variants",
                        p.shopDetails.variants.map((old, n) =>
                          n === i ? { ...old, available } : old,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      detail(
                        "variants",
                        p.shopDetails.variants.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Remover variação
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                disabled={p.shopDetails.variants.length >= 30}
                onClick={() =>
                  detail("variants", [
                    ...p.shopDetails.variants,
                    { label: "", url: "", available: true },
                  ])
                }
              >
                Adicionar variação
              </button>
            </fieldset>
            <div className="store-admin-grid">
              {(
                [
                  ["relatedIds", "Produtos relacionados"],
                  ["complementaryIds", "Monte seu kit"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={`${label}: IDs separados por vírgula`}>
                  <input
                    value={p.shopDetails[key].join(",")}
                    onChange={(e) =>
                      detail(
                        key,
                        e.target.value
                          .split(",")
                          .map((v) => Number(v.trim()))
                          .filter((v) => v > 0),
                      )
                    }
                  />
                  <small>
                    Use o ID exibido na listagem. Só produtos publicados e autorizados para a
                    vitrine serão exibidos.
                  </small>
                </Field>
              ))}
            </div>
            <div className="store-actions">
              <button
                className="store-primary"
                disabled={mutation.isPending || query.isError || query.isPending}
              >
                Salvar produto
              </button>
              <button
                type="button"
                onClick={() => {
                  setP(blankProduct());
                  setMessage("");
                  setError("");
                }}
              >
                Limpar / novo produto
              </button>
            </div>
          </form>
          <section className="store-admin-panel">
            <h2>Cadastro existente</h2>
            <Field label="Buscar produtos cadastrados">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </Field>
            <div className="store-admin-list">
              {query.data?.products.map((item) => (
                <article key={item.id}>
                  <div>
                    <h3>
                      #{item.id} · {item.title}
                    </h3>
                    <small>
                      {item.status === "published" ? "Publicado" : "Rascunho"} ·{" "}
                      {item.visiblePublic ? "Público" : "Oculto ao público"} ·{" "}
                      {item.visibleMembers ? "Membros" : "Oculto aos membros"}
                    </small>
                  </div>
                  <button
                    onClick={() => {
                      setP(item);
                      setMessage("");
                      setError("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Editar
                  </button>
                </article>
              ))}
            </div>
            <div className="store-actions">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </button>
              <span>Página {page}</span>
              <button disabled={!query.data?.hasMore} onClick={() => setPage(page + 1)}>
                Próxima
              </button>
            </div>
          </section>
        </>
      )}
      {tab === "collections" && (
        <>
          <form
            className="store-admin-panel"
            onSubmit={(e) => {
              e.preventDefault();
              void save("store.admin.saveCollection", c, storeCollectionSchema);
            }}
          >
            <h2>{c.id ? "Editar categoria / coleção" : "Nova categoria / coleção"}</h2>
            <div className="store-admin-grid">
              {(["name", "slug", "description"] as const).map((key, i) => (
                <Field key={key} label={["Nome", "Slug", "Descrição"][i]}>
                  <input value={c[key]} onChange={(e) => setC({ ...c, [key]: e.target.value })} />
                </Field>
              ))}
              <Field label="Tipo">
                <select
                  disabled={!!c.id}
                  value={c.kind}
                  onChange={(e) =>
                    setC({ ...c, kind: e.target.value as "category" | "collection" })
                  }
                >
                  <option value="category">Categoria</option>
                  <option value="collection">Coleção</option>
                </select>
              </Field>
              <Field label="Ordem">
                <input
                  type="number"
                  min="0"
                  value={c.position}
                  onChange={(e) => setC({ ...c, position: Number(e.target.value) })}
                />
              </Field>
              <Field label="Publicação">
                <select
                  value={c.status}
                  onChange={(e) => setC({ ...c, status: e.target.value as "draft" | "published" })}
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </Field>
            </div>
            <Check
              label="Destaque no menu"
              value={c.featured}
              onChange={(v) => setC({ ...c, featured: v })}
            />
            <ImageField
              label="Capa da coleção"
              value={c.imageUrl}
              onChange={(url) => setC({ ...c, imageUrl: url })}
            />
            <small>
              Colocar a coleção em rascunho esconde o agrupamento, não despublica os produtos
              vinculados.
            </small>
            <button
              className="store-primary"
              disabled={mutation.isPending || query.isError || query.isPending}
            >
              Salvar categoria / coleção
            </button>
            <button type="button" onClick={() => setC(blankCollection())}>
              Nova categoria / coleção
            </button>
          </form>
          <div className="store-admin-list">
            {query.data?.collections.map((item) => (
              <article key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <small>
                    {item.kind === "category" ? "Categoria" : "Coleção"} · {item.status}
                  </small>
                </div>
                <button onClick={() => setC(item)}>Editar</button>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "banners" && (
        <form
          className="store-admin-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void save("store.admin.saveSettings", s, storeSettingsSchema);
          }}
        >
          <h2>Home e banners</h2>
          {(
            [
              ["promotion", "Faixa promocional (vazio para ocultar)"],
              ["heroTitle", "Título principal"],
              ["heroDescription", "Descrição principal"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                value={s[key]}
                onChange={(e) => setSettings({ ...s, [key]: e.target.value })}
              />
            </Field>
          ))}
          <ImageField
            label="Banner principal"
            value={s.heroImage}
            onChange={(url) => setSettings({ ...s, heroImage: url })}
          />
          <Field label="Destino do banner">
            <select
              value={s.heroCollectionId ?? ""}
              onChange={(e) =>
                setSettings({
                  ...s,
                  heroCollectionId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Catálogo completo</option>
              {query.data?.collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <fieldset>
            <legend>Banners editoriais</legend>
            {s.editorial.map((b, i) => (
              <fieldset key={i}>
                <legend>Banner {i + 1}</legend>
                <Field label="Título">
                  <input
                    value={b.title}
                    onChange={(e) =>
                      setSettings({
                        ...s,
                        editorial: s.editorial.map((v, n) =>
                          n === i ? { ...v, title: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    value={b.description}
                    onChange={(e) =>
                      setSettings({
                        ...s,
                        editorial: s.editorial.map((v, n) =>
                          n === i ? { ...v, description: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </Field>
                <ImageField
                  label="Imagem"
                  value={b.imageUrl}
                  onChange={(url) =>
                    setSettings({
                      ...s,
                      editorial: s.editorial.map((v, n) => (n === i ? { ...v, imageUrl: url } : v)),
                    })
                  }
                />
                <Field label="Coleção de destino">
                  <select
                    value={b.collectionId ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...s,
                        editorial: s.editorial.map((v, n) =>
                          n === i
                            ? { ...v, collectionId: e.target.value ? Number(e.target.value) : null }
                            : v,
                        ),
                      })
                    }
                  >
                    <option value="">Sem link</option>
                    {query.data?.collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...s, editorial: s.editorial.filter((_, n) => n !== i) })
                  }
                >
                  Remover banner
                </button>
              </fieldset>
            ))}
            <button
              type="button"
              disabled={s.editorial.length >= 4}
              onClick={() =>
                setSettings({
                  ...s,
                  editorial: [
                    ...s.editorial,
                    { title: "", description: "", imageUrl: "", collectionId: null },
                  ],
                })
              }
            >
              Adicionar banner editorial
            </button>
          </fieldset>
          <button
            className="store-primary"
            disabled={mutation.isPending || query.isError || query.isPending}
          >
            Salvar home
          </button>
        </form>
      )}
    </div>
  );
}
