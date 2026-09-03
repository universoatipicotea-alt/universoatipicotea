import { useAuth } from "@/_core/hooks/useAuth";
import { ContentEmpty, MemberShell } from "@/components/MemberShell";
import { CategoryHub } from "@/components/CategoryHub";
import { SearchField, SectionTitle, SelectField, Toolbar } from "@/components/ds";
import PdfReader from "@/components/PdfReaderClient";
import PdfCover from "@/components/PdfCover";
import { RecipeCover } from "@/components/RecipeCover";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { slugifyPt } from "@/lib/slug";
import {
  ArrowRight,
  ChefHat,
  Clock3,
  Heart,
  LockKeyhole,
  Maximize2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

function readingTime(summary: string, content?: string | null) {
  const words = `${summary || ""} ${content || ""}`.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(3, Math.ceil(words / 160))} min`;
}

function matchesCategory(category: string, selected: string) {
  if (selected === "Todas") return true;
  return (category || "").toLocaleLowerCase("pt-BR").trim() === selected.toLocaleLowerCase("pt-BR");
}

export default function Receitas({ categorySlug }: { categorySlug?: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const guides = trpc.community.publicAcademiaGuides.useQuery();
  const taxonomy = trpc.community.taxonomy.useQuery();
  const isMember = Boolean(user && ["member", "admin", "admin_master"].includes(user.accessRole));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");

  const readerRef = useRef<HTMLElement>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const value = Number(new URLSearchParams(window.location.search).get("guide"));
    return Number.isInteger(value) && value > 0 ? value : null;
  });
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`ua-favorite-recipes:${user?.id ?? "guest"}`) || "[]");
    } catch {
      return [];
    }
  });

  const selectedRecipe = guides.data?.find((item) => item.id === selectedRecipeId) ?? null;
  const closeReader = useCallback(() => {
    setSelectedRecipeId(null);
    setLocation("/receitas");
  }, [setLocation]);

  useEffect(() => {
    if (selectedRecipe && readerRef.current)
      readerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedRecipe]);

  useEffect(() => {
    if (!selectedRecipeId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeReader();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedRecipeId, closeReader]);

  const recipes = useMemo(() => guides.data || [], [guides.data]);
  const allCategories = useMemo(() => taxonomy.data?.recipeCategories ?? [], [taxonomy.data]);
  const activeCategory = categorySlug
    ? (allCategories.find((item: any) => item.slug === categorySlug) ?? null)
    : null;
  const scopedRecipes = useMemo(
    () =>
      categorySlug
        ? recipes.filter(
            (recipe: any) =>
              recipe.categoryId === activeCategory?.id ||
              slugifyPt(recipe.category || "") === categorySlug,
          )
        : recipes,
    [recipes, categorySlug, activeCategory?.id],
  );
  const categoryOptions = useMemo(
    () => ["Todas", ...allCategories.map((item: any) => item.name as string)],
    [allCategories],
  );
  const filteredRecipes = useMemo(
    () =>
      scopedRecipes.filter(
        (recipe) =>
          (categorySlug ? true : matchesCategory(recipe.category, category)) &&
          `${recipe.title} ${recipe.summary}`
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [scopedRecipes, category, query, categorySlug],
  );

  const toggleFavorite = (id: number) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(`ua-favorite-recipes:${user?.id ?? "guest"}`, JSON.stringify(next));
      return next;
    });
  };

  if (guides.isLoading)
    return (
      <MemberShell
        allowGuest
        eyebrow="Receitas"
        title="Receitas possíveis para a rotina real."
        description="Reunindo receitas e ideias para você explorar com calma."
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-3xl bg-[var(--linen)]" />
          ))}
        </div>
      </MemberShell>
    );
  if (guides.isError)
    return (
      <MemberShell
        allowGuest
        eyebrow="Receitas"
        title="Receitas possíveis para a rotina real."
        description="Não foi possível carregar as receitas agora."
      >
        <ContentEmpty
          icon={ChefHat}
          title="As receitas não abriram desta vez"
          text="Tente atualizar a página ou volte mais tarde."
        />
      </MemberShell>
    );

  if (!categorySlug) {
    return (
      <MemberShell
        allowGuest
        eyebrow="Receitas"
        title="Receitas organizadas por categoria."
        description="Escolha uma categoria para abrir as receitas disponíveis dentro dela."
      >
        <section>
          <SectionTitle
            label="Categorias"
            title={`${allCategories.length} ${allCategories.length === 1 ? "categoria disponível" : "categorias disponíveis"}`}
          />
          {allCategories.length ? (
            <CategoryHub
              items={allCategories as any}
              basePath="/receitas"
              emptyLabel="receitas"
              countFor={(slug) =>
                recipes.filter((recipe: any) => slugifyPt(recipe.category || "") === slug).length
              }
            />
          ) : (
            <ContentEmpty
              icon={ChefHat}
              title="Nenhuma categoria publicada"
              text="Cadastre categorias em Administração → Receitas."
            />
          )}
        </section>
      </MemberShell>
    );
  }

  return (
    <MemberShell
      allowGuest
      eyebrow="Receitas"
      title={activeCategory?.name || "Receitas"}
      description="Escolha uma receita, descubra novas possibilidades e encontre algo que faça sentido para a sua rotina."
    >
      <button
        type="button"
        onClick={() => setLocation("/receitas")}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]"
      >
        ← Todas as categorias
      </button>

      <section>
        <SectionTitle
          label="Receitas do Universo"
          title={`${scopedRecipes.length} ${scopedRecipes.length === 1 ? "receita disponível" : "receitas disponíveis"}`}
        />
        <Toolbar columns="md:grid-cols-[1.6fr_1fr]">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Buscar por título ou resumo"
            label="Buscar receitas"
          />
          <SelectField
            label="Trocar de categoria"
            value={activeCategory?.name || "Todas"}
            onChange={(event) => {
              const found = allCategories.find((item: any) => item.name === event.target.value);
              setLocation(found ? `/receitas/${found.slug}` : "/receitas");
            }}
          >
            {categoryOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </SelectField>
        </Toolbar>
        {filteredRecipes.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRecipes.map((recipe) => {
              const favorite = favorites.includes(recipe.id);
              return (
                <article
                  key={recipe.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_10px_28px_rgba(8,31,77,.04)] transition hover:shadow-[0_18px_38px_rgba(8,31,77,.08)]"
                >
                  <div className="relative border-b border-[var(--line)] bg-[var(--linen)]">
                    {recipe.coverImageUrl ? (
                      <PdfCover
                        src={recipe.coverImageUrl}
                        title={recipe.title}
                        ratio="3 / 4"
                        className="rounded-none"
                      />
                    ) : (
                      <div
                        className="grid aspect-[3/4] w-full place-items-center px-6 py-5"
                        style={{ backgroundColor: recipe.accentColor }}
                      >
                        <RecipeCover title={recipe.title} accentColor={recipe.accentColor} />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)]/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white">
                      <LockKeyhole size={11} /> Membros
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(recipe.id)}
                      aria-label={
                        favorite
                          ? `Remover ${recipe.title} dos favoritos`
                          : `Adicionar ${recipe.title} aos favoritos`
                      }
                      aria-pressed={favorite}
                      className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[var(--clay)] shadow-[0_6px_16px_rgba(8,31,77,.08)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {" "}
                      <Heart size={17} fill={favorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--sage)]">
                        {recipe.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--ink-soft)]">
                        <Clock3 size={13} /> {readingTime(recipe.summary, recipe.content)}
                      </span>
                    </div>
                    <h3 className="display-font mt-3 text-2xl font-semibold leading-tight">
                      {recipe.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-[var(--ink-soft)]">
                      {recipe.summary}
                    </p>
                    <Button
                      type="button"
                      onClick={() =>
                        isMember ? setSelectedRecipeId(recipe.id) : setLocation("/assinatura")
                      }
                      className="pressable mt-5 w-full rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"
                    >
                      {isMember ? "Abrir receita" : "Conhecer o acesso"}
                      <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <ContentEmpty
              icon={ChefHat}
              title="Nenhuma receita encontrada"
              text="Experimente outra busca ou escolha uma categoria diferente."
            />
          </div>
        )}
      </section>

      {selectedRecipe?.hasPdf ? (
        <section
          ref={readerRef}
          className="mt-10 rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">
                Leitor interno protegido
              </p>
              <h2 className="display-font mt-1 text-2xl font-semibold">{selectedRecipe.title}</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => readerRef.current?.requestFullscreen?.()}
                className="inline-flex items-center rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-extrabold text-[var(--sage-deep)] hover:bg-[var(--linen)]"
              >
                <Maximize2 size={14} className="mr-2" />
                Tela cheia
              </button>
              <button
                type="button"
                onClick={closeReader}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--ink-soft)] transition hover:bg-[var(--linen)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
                aria-label="Fechar leitor"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--ink-soft)]">
            Este conteúdo é disponibilizado somente para leitura dentro da plataforma.
          </p>
          <PdfReader
            src={`/api/protected-pdf/test-guide/${selectedRecipe.id}`}
            title={selectedRecipe.title}
            progressSource="testGuide"
            documentId={selectedRecipe.id}
          />
        </section>
      ) : null}

      <section className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-3xl bg-[var(--linen)] p-7 sm:p-9">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--clay)]">
            Uma jornada possível
          </p>
          <h2 className="display-font mt-3 max-w-xl text-3xl font-semibold leading-tight">
            A receita é só o começo.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            A partir de cada preparo, você pode descobrir estratégias, adaptar a rotina e construir
            repertório junto com outras famílias.
          </p>
        </article>
        <article className="rounded-3xl bg-[var(--sage-deep)] p-7 text-white sm:p-9">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#efd4a2]">
            Incluído na sua assinatura
          </p>
          <h2 className="display-font mt-3 text-3xl font-semibold leading-tight">
            Quer explorar mais conteúdos?
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/75">
            A biblioteca de guias faz parte do seu acesso ao Universo Atípico.
          </p>
          <Button
            type="button"
            onClick={() => setLocation("/biblioteca")}
            className="pressable mt-6 rounded-xl bg-[#efd4a2] text-xs font-extrabold text-[var(--ink)] hover:bg-white"
          >
            Ver a biblioteca <ArrowRight size={14} className="ml-2" />
          </Button>
        </article>
      </section>
    </MemberShell>
  );
}
