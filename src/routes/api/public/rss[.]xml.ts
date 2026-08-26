import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SITE_TITLE = "Central de Bulas";
const SITE_DESCRIPTION =
  "Aqui publicamos todas as bulas dos nossos produtos. Fique atento a alterações e correções.";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const Route = createFileRoute("/api/public/rss.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;

        const supabase = createClient(
          process.env["VITE_SUPABASE_URL"]!,
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const { data, error } = await supabase
          .from("articles")
          .select("title, slug, excerpt, content, author_name, published_at, tags")
          .eq("published", true)
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false })
          .limit(50);

        if (error) {
          return new Response("Erro ao gerar o feed", { status: 500 });
        }

        const items = (data ?? [])
          .map((article) => {
            const link = `${origin}/bulas/${article.slug}`;
            const description = stripHtml(article.excerpt || article.content).slice(0, 500);
            const categories = (article.tags ?? [])
              .map((tag: string) => `      <category>${escapeXml(tag)}</category>`)
              .join("\n");
            return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>${
        article.author_name ? `\n      <author>${escapeXml(article.author_name)}</author>` : ""
      }${categories ? `\n${categories}` : ""}
    </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(origin)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${origin}/api/public/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/rss+xml; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
