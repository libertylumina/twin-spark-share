import { createFileRoute, Link, useNavigate, stripSearchParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, X, Rows3, LayoutGrid } from "lucide-react";

import { formatDateParts, publishedArticlesQuery } from "@/lib/articles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const homeSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  view: fallback(z.enum(["lista", "grade"]), "lista").default("lista"),
});

const searchDefaults = { q: "", view: "lista" as const };


export const Route = createFileRoute("/")({
  validateSearch: zodValidator(homeSearchSchema),
  search: {
    middlewares: [stripSearchParams(searchDefaults)],
  },
  head: () => ({
    meta: [
      { title: "Central de Bulas — Atualização de documentos" },
      {
        name: "description",
        content:
          "Aqui publicamos todas as bulas dos nossos produtos. Fique atento a alterações e correções.",
      },
      { property: "og:title", content: "Central de Bulas — Atualização de documentos" },
      {
        property: "og:description",
        content: "Aqui publicamos todas as bulas dos nossos produtos. Fique atento a alterações e correções.",
      },
    ],
    links: [],
  }),
  component: Index,
});

function Index() {
  const { data: articles, isLoading, error } = useQuery(publishedArticlesQuery);
  const { q, view } = Route.useSearch();
  const isGrid = view === "grade";
  const navigate = useNavigate({ from: "/" });

  const filteredArticles = (articles ?? []).filter((article) => {
    return (
      normalize(article.title).includes(normalize(q)) ||
      normalize(article.excerpt).includes(normalize(q)) ||
      normalize(article.author_name).includes(normalize(q))
    );
  });

  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Atualização de documentos
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-foreground sm:text-5xl">
            Central de Bulas
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Aqui publicamos todas as bulas dos nossos produtos. Fique atento a alterações e correções.
          </p>
        </div>
      </section>

      <section className={cn("mx-auto px-4 sm:px-6 py-10", isGrid ? "max-w-7xl" : "max-w-4xl")}>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar bula por título, resumo ou autor"
                value={q}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, q: e.target.value }) })}
                className="h-12 rounded-xl pl-10 pr-10 text-base"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => navigate({ search: (prev) => ({ ...prev, q: "" }) })}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-secondary p-1">
              <button
                type="button"
                aria-label="Visualização em lista"
                aria-pressed={!isGrid}
                onClick={() => navigate({ search: (prev) => ({ ...prev, view: "lista" as const }) })}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-lg transition-colors",
                  !isGrid
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Rows3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Visualização em 4 colunas"
                aria-pressed={isGrid}
                onClick={() => navigate({ search: (prev) => ({ ...prev, view: "grade" as const }) })}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-lg transition-colors",
                  isGrid
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          {isLoading
            ? "Carregando..."
            : `${filteredArticles.length} ${filteredArticles.length === 1 ? "resultado" : "resultados"}`}
        </div>

        <div className="mt-6">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando atualizações…</p>}
          {error && (
            <p className="text-sm text-destructive">Não foi possível carregar as atualizações.</p>
          )}
          {!isLoading && !error && filteredArticles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma publicação encontrada com os filtros selecionados.
            </p>
          )}

          <ul className="flex flex-col gap-8">
            {filteredArticles.map((article) => {
              const date = formatDateParts(article.published_at);
              return (
                <li
                  key={article.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:gap-6"
                >
                  <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-secondary px-2 py-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {date.month}
                    </span>
                    <span className="text-2xl font-semibold leading-tight text-foreground">
                      {date.day}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{date.year}</span>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold leading-snug">
                      <Link
                        to="/bulas/$slug"
                        params={{ slug: article.slug }}
                        className="transition-colors hover:text-brand"
                      >
                        {article.title}
                      </Link>
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {article.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
                          {tag}
                        </span>
                      ))}
                      {article.author_name && <span>por {article.author_name}</span>}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {article.excerpt}
                    </p>
                    <Link
                      to="/bulas/$slug"
                      params={{ slug: article.slug }}
                      className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
                    >
                      Continue lendo →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
