import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FileText,
  FolderSync,
  ImageIcon,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ContentEmpty, SectionHeading } from "@/components/MemberShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DRIVE_CLASSIFICATION_LABELS, type DriveClassification } from "@/lib/drive-import";
import { trpc } from "@/lib/trpc";

type Candidate = {
  itemId: number;
  key: string;
  targetKind: "module_cover" | "academy_guide";
  driveFileId: string;
  driveFolderId: string | null;
  title: string;
  position: number;
  suggestedModuleId: number | null;
  suggestedModuleName: string | null;
  suggestedContentPath: string;
  classifications: DriveClassification[];
  editorialStatus: "draft";
  platformSituation: string;
  currentFolder: string;
  correctFolder: string;
  recommendedAction: string;
  existingTargetId: number | null;
  selectedByDefault: boolean;
  alerts: string[];
  cover: { id: string; name: string; modifiedTime: string | null; version: string | null } | null;
  pdf: { id: string; name: string; modifiedTime: string | null; version: string | null } | null;
  video: { id: string; name: string; modifiedTime: string | null; version: string | null } | null;
  words: Array<{ id: string; name: string }>;
};

type Preview = {
  batchId: number;
  summary: Record<string, number>;
  candidates: Candidate[];
  ignored: Array<{ file: string; reason: string; path: string }>;
  warnings: string[];
  diagnostics: {
    platformOnly: Array<{
      id: number;
      title: string;
      status: string;
      moduleId: number | null;
      issue: string;
    }>;
    publishedWithoutModule: Array<{ id: number; title: string }>;
  };
  editorialComparison: {
    newGuide: {
      title: string;
      objective: string;
      structure: string;
      topics: string;
      audience: string;
    };
    existingGuide: {
      title: string;
      objective: string;
      structure: string;
      topics: string;
      audience: string;
    };
    overlap: string;
    complementary: string;
    possibleClassification: string;
    recommendation: string;
  };
};

type Override = { moduleId: number | null; title: string; position: number };

function sourceFile(candidate: Candidate) {
  return candidate.pdf || candidate.video || candidate.cover;
}

function typeLabel(candidate: Candidate) {
  if (candidate.targetKind === "module_cover") return "Capa de módulo";
  if (candidate.pdf) return "PDF";
  if (candidate.video) return "Vídeo";
  if (candidate.words.length) return "Word";
  return "Arquivo";
}

function formatVersion(candidate: Candidate) {
  const file = sourceFile(candidate);
  if (!file) return "—";
  if (file.version) return `Drive v${file.version}`;
  return file.modifiedTime
    ? `Atualizado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(file.modifiedTime))}`
    : "Versão não informada";
}

function Classification({ values }: { values: DriveClassification[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${
            value === "ready" || value === "registered"
              ? "bg-[var(--sage-pale)] text-[var(--sage-deep)]"
              : value === "editorial_conflict" || value === "registered_incorrectly"
                ? "bg-[#f5e7df] text-[#9c583c]"
                : "bg-[#fff1d8] text-[#8b5f16]"
          }`}
        >
          {DRIVE_CLASSIFICATION_LABELS[value]}
        </span>
      ))}
    </div>
  );
}

export default function DriveImportAdmin() {
  const defaults = trpc.community.master.drive.defaults.useQuery();
  const taxonomy = trpc.community.admin.taxonomy.useQuery();
  const preview = trpc.community.master.drive.preview.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const [rootFolder, setRootFolder] = useState("");
  const [coversFolder, setCoversFolder] = useState("");
  const [extraFolders, setExtraFolders] = useState("");
  const [result, setResult] = useState<Preview | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Record<number, Override>>({});

  useEffect(() => {
    if (!defaults.data || rootFolder) return;
    setRootFolder(defaults.data.rootFolderUrl);
    setCoversFolder(defaults.data.coversFolderUrl);
    setExtraFolders((defaults.data.extraFolderUrls || []).join("\n"));
  }, [defaults.data, rootFolder]);

  const modules = useMemo(
    () =>
      (
        [...(taxonomy.data?.academyModules ?? [])] as Array<{
          id: number;
          name: string;
          position: number;
          status: string;
        }>
      ).sort((a, b) => a.position - b.position),
    [taxonomy.data],
  );

  const findFiles = async () => {
    try {
      const data = (await preview.mutateAsync({
        rootFolder,
        coversFolder,
        extraFolders: extraFolders
          .split(/[\n,;]+/)
          .map((value) => value.trim())
          .filter(Boolean),
      })) as Preview;
      setResult(data);
      setSelected(
        new Set(
          data.candidates
            .filter((candidate) => candidate.selectedByDefault)
            .map((candidate) => candidate.itemId),
        ),
      );
      setOverrides(
        Object.fromEntries(
          data.candidates.map((candidate) => [
            candidate.itemId,
            {
              moduleId: candidate.suggestedModuleId,
              title: candidate.title,
              position: candidate.position,
            },
          ]),
        ),
      );
      toast.success(`${data.candidates.length} candidatos encontrados. Nada foi publicado.`);
    } catch {
      // O toast da mutation já apresenta a mensagem segura do backend.
    }
  };

  const toggle = (itemId: number, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  return (
    <section>
      <SectionHeading label="Operação assistida" title="Importação do Drive" />
      <p className="-mt-4 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
        Busque, confira e relacione os materiais antes de copiar qualquer arquivo. O cadastro manual
        continua disponível e nenhum candidato é publicado automaticamente.
      </p>

      <div className="mt-7 grid gap-4 rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-6">
        <div>
          <Label htmlFor="drive-root">Pasta raiz do Universo Atípico</Label>
          <Input
            id="drive-root"
            value={rootFolder}
            onChange={(event) => setRootFolder(event.target.value)}
            placeholder="URL ou ID da pasta raiz"
            className="mt-2 h-11"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label htmlFor="drive-covers">Pasta das capas oficiais</Label>
            <Input
              id="drive-covers"
              value={coversFolder}
              onChange={(event) => setCoversFolder(event.target.value)}
              placeholder="URL ou ID da pasta de capas"
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="drive-extra">Pastas adicionais</Label>
            <Input
              id="drive-extra"
              value={extraFolders}
              onChange={(event) => setExtraFolders(event.target.value)}
              placeholder="Separe URLs por vírgula ou linha"
              className="mt-2 h-11"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
          <p className="inline-flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            <ShieldCheck size={15} className="text-[var(--sage-deep)]" /> Somente Admin Master ·
            consulta de leitura no Drive
          </p>
          <Button
            type="button"
            onClick={() => void findFiles()}
            disabled={preview.isPending || !rootFolder || !coversFolder}
            className="rounded-xl bg-[var(--sage-deep)] font-extrabold text-white"
          >
            {preview.isPending ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <FileSearch size={16} className="mr-2" />
            )}
            Buscar arquivos
          </Button>
        </div>
      </div>

      {!result ? (
        <div className="mt-8">
          <ContentEmpty
            icon={FolderSync}
            title="Faça uma busca segura no Drive"
            text="A prévia identifica módulos, PDFs, capas, versões, conflitos e materiais sem correspondência."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              [result.summary.candidates, "candidatos"],
              [result.summary.moduleCovers, "capas de módulo"],
              [result.summary.academyGuides, "guias"],
              [result.summary.conflicts, "conflitos"],
              [result.summary.ignored, "ignorados"],
            ].map(([value, label]) => (
              <article key={label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <strong className="display-font text-3xl font-semibold">{value}</strong>
                <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {label}
                </span>
              </article>
            ))}
          </div>

          {result.warnings.map((warning) => (
            <div
              key={warning}
              className="flex gap-3 rounded-2xl border border-[#edd6a7] bg-[#fffaf0] p-4 text-sm text-[#704e17]"
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {warning}
            </div>
          ))}

          <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-5">
              <div>
                <h3 className="display-font text-2xl font-semibold">Materiais encontrados</h3>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  Lote de prévia #{result.batchId}
                </p>
              </div>
              <span className="rounded-full bg-[var(--sage-pale)] px-3 py-1.5 text-xs font-extrabold text-[var(--sage-deep)]">
                {selected.size} selecionado(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] text-left text-xs">
                <thead className="bg-[var(--linen)] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                  <tr>
                    <th className="p-3">Selecionar</th>
                    <th className="p-3">Arquivo / tipo</th>
                    <th className="p-3">Módulo e caminho sugeridos</th>
                    <th className="p-3">Capa</th>
                    <th className="p-3">Versão</th>
                    <th className="p-3">Status editorial</th>
                    <th className="p-3">Situação</th>
                    <th className="p-3">Pasta atual / correta</th>
                    <th className="p-3">Ação recomendada</th>
                  </tr>
                </thead>
                <tbody>
                  {result.candidates.map((candidate) => {
                    const form = overrides[candidate.itemId] || {
                      moduleId: candidate.suggestedModuleId,
                      title: candidate.title,
                      position: candidate.position,
                    };
                    const blocked = candidate.classifications.includes("editorial_conflict");
                    return (
                      <tr key={candidate.key} className="border-t border-[var(--line)] align-top">
                        <td className="p-3">
                          <Checkbox
                            checked={selected.has(candidate.itemId)}
                            disabled={blocked}
                            onCheckedChange={(value) => toggle(candidate.itemId, value === true)}
                            aria-label={`Selecionar ${candidate.title}`}
                          />
                        </td>
                        <td className="max-w-64 p-3">
                          <div className="flex gap-2">
                            {candidate.targetKind === "module_cover" ? (
                              <ImageIcon size={16} />
                            ) : (
                              <FileText size={16} />
                            )}
                            <div>
                              <strong className="block break-words">
                                {sourceFile(candidate)?.name || candidate.title}
                              </strong>
                              <span className="mt-1 block text-[var(--ink-soft)]">
                                {typeLabel(candidate)}
                              </span>
                              <Classification values={candidate.classifications} />
                            </div>
                          </div>
                        </td>
                        <td className="w-72 p-3">
                          <select
                            value={form.moduleId ?? ""}
                            onChange={(event) =>
                              setOverrides((current) => ({
                                ...current,
                                [candidate.itemId]: {
                                  ...form,
                                  moduleId: event.target.value ? Number(event.target.value) : null,
                                },
                              }))
                            }
                            className="h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2"
                          >
                            <option value="">Sem módulo definido</option>
                            {modules.map((module) => (
                              <option key={module.id} value={module.id}>
                                {String(module.position).padStart(2, "0")} — {module.name}
                              </option>
                            ))}
                          </select>
                          {candidate.targetKind === "academy_guide" ? (
                            <div className="mt-2 grid grid-cols-[62px_1fr] gap-2">
                              <Input
                                type="number"
                                min={0}
                                value={form.position}
                                onChange={(event) =>
                                  setOverrides((current) => ({
                                    ...current,
                                    [candidate.itemId]: {
                                      ...form,
                                      position: Number(event.target.value) || 0,
                                    },
                                  }))
                                }
                                aria-label="Posição"
                                className="h-9"
                              />
                              <Input
                                value={form.title}
                                onChange={(event) =>
                                  setOverrides((current) => ({
                                    ...current,
                                    [candidate.itemId]: { ...form, title: event.target.value },
                                  }))
                                }
                                aria-label="Título"
                                className="h-9"
                              />
                            </div>
                          ) : null}
                          <span className="mt-2 block text-[var(--ink-soft)]">
                            {candidate.suggestedContentPath}
                          </span>
                        </td>
                        <td className="max-w-56 p-3">
                          {candidate.cover?.name || "Sem capa separada"}
                        </td>
                        <td className="max-w-44 p-3">{formatVersion(candidate)}</td>
                        <td className="p-3">
                          <span className="rounded-full bg-[var(--lavender)] px-2 py-1 font-extrabold text-[#665d81]">
                            Rascunho
                          </span>
                        </td>
                        <td className="max-w-64 p-3">{candidate.platformSituation}</td>
                        <td className="max-w-72 p-3">
                          <strong className="block">Atual</strong>
                          {candidate.currentFolder}
                          <strong className="mt-2 block">Correta</strong>
                          {candidate.correctFolder}
                        </td>
                        <td className="max-w-72 p-3">
                          {candidate.recommendedAction}
                          {candidate.alerts.map((alert) => (
                            <span key={alert} className="mt-2 block text-[#9c583c]">
                              ⚠ {alert}
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--paper)] p-5">
              <p className="text-xs text-[var(--ink-soft)]">
                A importação sempre criará ou atualizará rascunhos. Publicar continua sendo uma ação
                manual.
              </p>
              <Button
                type="button"
                disabled
                className="rounded-xl bg-[var(--sage-deep)] font-extrabold text-white"
              >
                Importar selecionados
              </Button>
            </div>
          </div>

          <section className="rounded-3xl border border-[#e4c8bd] bg-[#fff8f5] p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9c583c]">
              Conflito editorial
            </p>
            <h3 className="display-font mt-2 text-3xl font-semibold">
              Dois materiais sobre o pós-diagnóstico
            </h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {[result.editorialComparison.newGuide, result.editorialComparison.existingGuide].map(
                (guide) => (
                  <article
                    key={guide.title}
                    className="rounded-2xl border border-[var(--line)] bg-white p-5"
                  >
                    <h4 className="font-extrabold">{guide.title}</h4>
                    <dl className="mt-4 space-y-3 text-xs leading-5">
                      <div>
                        <dt className="font-extrabold">Objetivo</dt>
                        <dd>{guide.objective}</dd>
                      </div>
                      <div>
                        <dt className="font-extrabold">Estrutura</dt>
                        <dd>{guide.structure}</dd>
                      </div>
                      <div>
                        <dt className="font-extrabold">Tópicos</dt>
                        <dd>{guide.topics}</dd>
                      </div>
                      <div>
                        <dt className="font-extrabold">Público</dt>
                        <dd>{guide.audience}</dd>
                      </div>
                    </dl>
                  </article>
                ),
              )}
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6">
              <p>
                <strong>Sobreposição:</strong> {result.editorialComparison.overlap}
              </p>
              <p>
                <strong>Complementar:</strong> {result.editorialComparison.complementary}
              </p>
              <p>
                <strong>Classificação possível:</strong>{" "}
                {result.editorialComparison.possibleClassification}
              </p>
              <p>
                <strong>Recomendação:</strong> {result.editorialComparison.recommendation}
              </p>
            </div>
          </section>

          {result.diagnostics.publishedWithoutModule.length > 0 ||
          result.diagnostics.platformOnly.length > 0 ? (
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <h3 className="display-font text-2xl font-semibold">
                Diferenças encontradas na plataforma
              </h3>
              {result.diagnostics.publishedWithoutModule.map((item) => (
                <p key={`null-${item.id}`} className="mt-3 flex gap-2 text-sm text-[#9c583c]">
                  <AlertTriangle size={16} /> Publicado sem módulo: {item.title}
                </p>
              ))}
              {result.diagnostics.platformOnly.map((item) => (
                <p key={`only-${item.id}`} className="mt-3 flex gap-2 text-sm">
                  <AlertTriangle size={16} className="text-[#8b5f16]" /> {item.title}: {item.issue}
                </p>
              ))}
            </section>
          ) : (
            <div className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 text-sm">
              <CheckCircle2 size={18} className="text-[var(--sage-deep)]" /> Nenhum conteúdo
              publicado sem módulo foi encontrado nesta prévia.
            </div>
          )}

          <details className="rounded-3xl border border-[var(--line)] bg-white p-5">
            <summary className="cursor-pointer font-extrabold">
              Arquivos preservados e não publicáveis ({result.ignored.length})
            </summary>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {result.ignored.map((item, index) => (
                <p
                  key={`${item.file}-${index}`}
                  className="rounded-xl bg-[var(--paper)] p-3 text-xs"
                >
                  <strong>{item.file}</strong>
                  <span className="block text-[var(--ink-soft)]">
                    {item.reason} · {item.path}
                  </span>
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
