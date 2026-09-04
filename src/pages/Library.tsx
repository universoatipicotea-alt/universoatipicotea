import { useAuth } from "@/_core/hooks/useAuth";
import { ContentEmpty, MemberShell } from "@/components/MemberShell";
import { PdfCover } from "@/components/PdfCover";
import { PdfReaderDialog, type ReaderDocument } from "@/components/PdfReaderDialog";
import { SearchField, SectionTitle, SelectField, Toolbar } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BookOpen, CheckCircle2, ChefHat, Clock3, History, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type ProgressItem = {
  sourceType: "guide" | "testGuide";
  documentId: number;
  title: string;
  category: string;
  coverImageUrl?: string | null;
  accentColor?: string | null;
  currentPage: number;
  pageCount: number;
  percent: number;
  completed?: boolean;
  lastAccessAt?: string | null;
  updatedAt?: string | null;
};

function dateLabel(value?: string | null) {
  if (!value) return "Acessado recentemente";
  return `Acessado em ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))}`;
}

function ProgressCard({ item, onOpen }: { item: ProgressItem; onOpen: () => void }) {
  const completed = Boolean(item.completed) || item.percent >= 100;
  return (
    <article className="soft-card flex flex-col overflow-hidden rounded-3xl bg-white">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--linen)]">
        <PdfCover src={item.coverImageUrl} title={item.title} className="h-full rounded-none" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)]/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white">
          {item.sourceType === "testGuide" ? <ChefHat size={12} /> : <BookOpen size={12} />}
          {item.sourceType === "testGuide" ? "Receita" : "Academia"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sage)]">
          {item.category}
        </p>
        <h3 className="display-font mt-2 text-2xl font-semibold leading-tight">{item.title}</h3>
        <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
          <Clock3 size={14} /> {dateLabel(item.lastAccessAt || item.updatedAt)}
        </p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.13em] text-[var(--ink-soft)]">
            <span>
              {completed ? "Concluído" : `Página ${item.currentPage} de ${item.pageCount}`}
            </span>
            <span>{item.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--linen)]">
            <div
              className="h-full rounded-full bg-[var(--sage-deep)]"
              style={{ width: `${Math.max(2, item.percent)}%` }}
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={onOpen}
          className="pressable mt-6 w-full rounded-xl bg-[var(--sage-deep)] text-xs font-extrabold text-white hover:bg-[var(--ink)]"
        >
          {completed ? (
            <RotateCcw size={14} className="mr-2" />
          ) : (
            <BookOpen size={14} className="mr-2" />
          )}
          {completed ? "Ler novamente" : `Continuar da página ${item.currentPage}`}
        </Button>
      </div>
    </article>
  );
}

export default function Library() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const dashboard = trpc.community.memberDashboard.useQuery(undefined, { enabled: Boolean(user) });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [reading, setReading] = useState<ReaderDocument | null>(null);

  const history = useMemo(
    () =>
      ((dashboard.data?.progress || []) as ProgressItem[]).filter(
        (item) => item.pageCount > 0 && item.currentPage > 0,
      ),
    [dashboard.data?.progress],
  );
  const inProgress = useMemo(
    () => history.filter((item) => !item.completed && item.percent < 100),
    [history],
  );
  const filteredHistory = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return history.filter((item) => {
      const completed = Boolean(item.completed) || item.percent >= 100;
      const matchesStatus =
        status === "Todos" ||
        (status === "Em andamento" && !completed) ||
        (status === "Concluídos" && completed);
      const matchesQuery =
        !term || `${item.title} ${item.category}`.toLocaleLowerCase("pt-BR").includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [history, query, status]);

  const openReader = (item: ProgressItem) => {
    const document = {
      id: item.documentId,
      title: item.title,
      sourceType: item.sourceType,
    } satisfies ReaderDocument;
    setReading(document);
    setLocation(`/biblioteca?source=${item.sourceType}&guide=${item.documentId}`);
  };
  const closeReader = useCallback(() => {
    setReading(null);
    setLocation("/biblioteca");
  }, [setLocation]);

  useEffect(() => {
    if (!user || reading || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const documentId = Number(params.get("guide"));
    const sourceType = params.get("source") === "testGuide" ? "testGuide" : "guide";
    const item = history.find(
      (row) => row.documentId === documentId && row.sourceType === sourceType,
    );
    if (item) setReading({ id: item.documentId, title: item.title, sourceType: item.sourceType });
  }, [history, reading, user]);

  useEffect(() => {
    if (!reading) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeReader();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [reading, closeReader]);

  if (!user)
    return (
      <MemberShell
        allowGuest
        eyebrow="Biblioteca"
        title="Seu histórico pessoal de leitura."
        description="Entre para retomar guias e receitas exatamente de onde parou."
      >
        <ContentEmpty
          icon={History}
          title="Entre para acessar sua biblioteca"
          text="O histórico e o progresso são pessoais e ficam vinculados à sua conta."
        />
        <div className="mt-5 flex justify-center">
          <Button onClick={() => setLocation("/entrar?next=/biblioteca")}>
            Entrar na minha conta
          </Button>
        </div>
      </MemberShell>
    );

  if (dashboard.isLoading)
    return (
      <MemberShell
        eyebrow="Biblioteca"
        title="Seu histórico pessoal de leitura."
        description="Recuperando seu progresso…"
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-96 animate-pulse rounded-3xl bg-[var(--linen)]" />
          ))}
        </div>
      </MemberShell>
    );

  if (dashboard.isError)
    return (
      <MemberShell
        eyebrow="Biblioteca"
        title="Seu histórico pessoal de leitura."
        description="Não foi possível recuperar seu progresso agora."
      >
        <ContentEmpty
          icon={History}
          title="A biblioteca não abriu desta vez"
          text="Atualize a página ou tente novamente mais tarde."
        />
      </MemberShell>
    );

  return (
    <MemberShell
      eyebrow="Biblioteca"
      title="Seu histórico pessoal de leitura."
      description="Continue os conteúdos iniciados e encontre tudo o que já leu no Universo Atípico."
    >
      {inProgress.length ? (
        <section className="mb-12">
          <SectionTitle
            label="Continuar lendo"
            title={`${inProgress.length} ${inProgress.length === 1 ? "conteúdo em andamento" : "conteúdos em andamento"}`}
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {inProgress.slice(0, 3).map((item) => (
              <ProgressCard
                key={`${item.sourceType}-${item.documentId}`}
                item={item}
                onOpen={() => openReader(item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle
          label="Histórico"
          title={`${history.length} ${history.length === 1 ? "conteúdo acessado" : "conteúdos acessados"}`}
        />
        {history.length ? (
          <>
            <Toolbar columns="md:grid-cols-[1.6fr_1fr]">
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Buscar no histórico"
                label="Buscar no histórico"
              />
              <SelectField
                label="Filtrar histórico"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>Todos</option>
                <option>Em andamento</option>
                <option>Concluídos</option>
              </SelectField>
            </Toolbar>
            {filteredHistory.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredHistory.map((item) => (
                  <ProgressCard
                    key={`${item.sourceType}-${item.documentId}`}
                    item={item}
                    onOpen={() => openReader(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <ContentEmpty
                  icon={CheckCircle2}
                  title="Nenhum item neste filtro"
                  text="Escolha outro filtro ou termo de busca."
                />
              </div>
            )}
          </>
        ) : (
          <ContentEmpty
            icon={History}
            title="Seu histórico ainda está vazio"
            text="Abra uma receita ou um guia na Academia. Assim que começar a leitura, ele aparecerá aqui."
          />
        )}
      </section>
      {reading ? <PdfReaderDialog document={reading} onClose={closeReader} /> : null}
    </MemberShell>
  );
}
