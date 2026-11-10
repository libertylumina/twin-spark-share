import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paginateItems } from "@/lib/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  allArticlesQuery,
  articleStatus,
  deleteArticle,
  formatDateTime,
  statusLabel,
  type ArticleStatus,
} from "@/lib/articles";

type Status = "todos" | ArticleStatus;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type AdminSearch = {
  pagina?: number | undefined;
  q?: string | undefined;
  autor?: string | undefined;
  status?: Status | undefined;
};

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Postagens — Central de Bulas" },
      { name: "description", content: "Gerencie e exporte as postagens da Central de Bulas." },
      { property: "og:title", content: "Postagens — Central de Bulas" },
      { property: "og:description", content: "Gerencie e exporte as postagens da Central de Bulas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AdminSearch => {
    const rawStatus = search["status"];
    const rawQ = search["q"];
    const rawAutor = search["autor"];
    const rawPage = Number(search["pagina"]);
    return {
      pagina: Number.isSafeInteger(rawPage) && rawPage > 1 ? rawPage : undefined,
      q: typeof rawQ === "string" && rawQ ? rawQ : undefined,
      autor: typeof rawAutor === "string" && rawAutor ? rawAutor : undefined,
      status:
        rawStatus === "publicado" || rawStatus === "rascunho" || rawStatus === "agendado"
          ? (rawStatus as Status)
          : undefined,
    };
  },
  component: AdminList,
});

function AdminList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: "/admin/" });
  const search = Route.useSearch();
  const q = search.q ?? "";
  const autor = search.autor ?? "";
  const status: Status = search.status ?? "todos";
  const { data: articles, isLoading } = useQuery(allArticlesQuery);

  const authors = Array.from(
    new Set((articles ?? []).map((a) => a.author_name).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const term = normalize(q);
  const filtered = (articles ?? []).filter((article) => {
    const matchesTerm =
      !term ||
      normalize(article.title).includes(term) ||
      normalize(article.author_name).includes(term) ||
      normalize(article.slug).includes(term);
    const matchesAuthor = !autor || article.author_name === autor;
    const matchesStatus = status === "todos" || articleStatus(article) === status;
    return matchesTerm && matchesAuthor && matchesStatus;
  });

  const hasFilters = Boolean(term) || Boolean(autor) || status !== "todos";
  const pagination = paginateItems(filtered, search.pagina ?? 1);

  const setSearch = (patch: AdminSearch) =>
    navigate({
      search: (prev) => {
        const next = { ...prev, ...patch, pagina: undefined };
        return {
          q: next.q || undefined,
          autor: next.autor || undefined,
          status: next.status && next.status !== "todos" ? next.status : undefined,
        };
      },
      replace: true,
    });

  const changePage = (pagina: number) => {
    void navigate({
      search: (prev) => ({ ...prev, pagina: pagina > 1 ? pagina : undefined }),
    });
  };

  const remove = useMutation({
    mutationFn: deleteArticle,
    onSuccess: async () => {
      toast.success("Postagem excluída.");
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Postagens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? `${filtered.length} de ${articles?.length ?? 0} postagem(ns)`
              : `${articles?.length ?? 0} postagem(ns) no blog`}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/admin/$id" params={{ id: "novo" }}>
            <Plus className="mr-1 h-4 w-4" /> Nova postagem
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full min-w-0 sm:min-w-[220px] sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setSearch({ q: event.target.value })}
            placeholder="Buscar por título, autor ou slug"
            className="pl-9"
            aria-label="Buscar postagens"
          />
        </div>

        <Select
          value={autor || "todos"}
          onValueChange={(value) => setSearch({ autor: value === "todos" ? "" : value })}
        >
          <SelectTrigger className="w-full sm:w-[190px]" aria-label="Filtrar por autor">
            <SelectValue placeholder="Autor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os autores</SelectItem>
            {authors.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="-mx-1 flex items-center gap-1 overflow-x-auto rounded-full bg-secondary p-1 sm:mx-0">
          {(
            [
              ["todos", "Todos"],
              ["publicado", "Publicados"],
              ["agendado", "Agendados"],
              ["rascunho", "Rascunhos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSearch({ status: value })}
              className={
                status === value
                  ? "shrink-0 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                  : "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch({ q: undefined, autor: undefined, status: "todos" })}
          >
            <X className="mr-1 h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>}

      {articles && articles.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Nenhuma postagem ainda. Crie a primeira.
        </p>
      )}

      {articles && articles.length > 0 && filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Nenhuma postagem encontrada com esses filtros.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {pagination.items.map((article) => {
          const itemStatus = articleStatus(article);
          return (
          <li
            key={article.id}
            className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold leading-snug">{article.title}</h2>
                <span
                  className={
                    itemStatus === "publicado"
                      ? "rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-brand-foreground"
                      : itemStatus === "agendado"
                        ? "rounded-full border border-brand px-2 py-0.5 text-[11px] font-semibold text-brand"
                        : "rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                  }
                >
                  {statusLabel[itemStatus]}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                /bulas/{article.slug} ·{" "}
                {itemStatus === "agendado" ? "publica em " : ""}
                {formatDateTime(article.published_at)}
              </p>
              {article.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button asChild size="icon" variant="ghost" title="Ver postagem">
                <Link to="/bulas/$slug" params={{ slug: article.slug }}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="icon" variant="ghost" title="Editar">
                <Link to="/admin/$id" params={{ id: article.id }}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Excluir"
                className="text-destructive hover:text-destructive"
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Excluir "${article.title}"?`)) remove.mutate(article.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
          );
        })}
      </ul>
      {filtered.length > 0 && (
        <nav aria-label="Paginação das postagens" className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {pagination.start}–{pagination.end} de {filtered.length} postagens
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Página anterior"
              title="Página anterior"
              disabled={pagination.page === 1}
              onClick={() => changePage(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums">Página {pagination.page} de {pagination.totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próxima página"
              title="Próxima página"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => changePage(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
