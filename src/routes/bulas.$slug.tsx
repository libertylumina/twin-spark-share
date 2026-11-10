import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { articleBySlugQuery, isHtmlContent } from "@/lib/articles";
import { sanitizeArticleHtml } from "@/lib/sanitize";

const SITE = "Central de Bulas";

function plainText(value: string, max = 155) {
  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export const Route = createFileRoute("/bulas/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(articleBySlugQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: `Artigo não encontrado — ${SITE}` },
          { name: "description", content: "Esta publicação não está disponível na Central de Bulas." },
          { property: "og:title", content: `Artigo não encontrado — ${SITE}` },
          { property: "og:description", content: "Esta publicação não está disponível na Central de Bulas." },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.title} — ${SITE}`;
    const description =
      plainText(loaderData.excerpt || loaderData.content) ||
      "Detalhes completos da atualização dos nossos serviços.";
    const image = /^https:\/\//.test(loaderData.cover_image_url)
      ? loaderData.cover_image_url
      : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: ArticlePage,
  pendingComponent: () => (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-sm text-muted-foreground">
      Carregando artigo…
    </div>
  ),
  errorComponent: () => <ArticleMissing />,
  notFoundComponent: () => <ArticleMissing />,
});

function ArticleMissing() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="text-2xl font-semibold">Artigo não encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esta publicação não existe ou não está publicada.
      </p>
      <Link to="/" search={{ q: "", view: "lista" }} className="mt-6 inline-flex text-sm font-medium text-brand hover:underline">
        ← Voltar para as publicações
      </Link>
    </div>
  );
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleBySlugQuery(slug));

  if (!article) return <ArticleMissing />;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <Link to="/" search={{ q: "", view: "lista" }} className="text-sm font-medium text-brand hover:underline">
        ← Todas as atualizações
      </Link>

      <header className="mt-6 border-b border-border pb-6">
        <h1 className="break-words text-2xl font-semibold leading-tight sm:text-4xl">{article.title}</h1>
      </header>

      {article.cover_image_url && (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="mt-6 aspect-video w-full rounded-xl border border-border object-cover"
        />
      )}

      {isHtmlContent(article.content) ? (
        <div
          className="prose-article mt-6 overflow-x-auto text-[15px]"
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
        />
      ) : (
      <div className="prose-article mt-6 text-[15px]">
        {article.content.split(/\n{2,}/).map((block, index) => {
          const lines = block.split("\n");
          if (lines.every((line) => line.trim().startsWith("-"))) {
            return (
              <ul key={index}>
                {lines.map((line, i) => (
                  <li key={i}>{line.replace(/^\s*-\s*/, "")}</li>
                ))}
              </ul>
            );
          }
          return <p key={index}>{block}</p>;
        })}
      </div>
      )}
    </article>
  );
}