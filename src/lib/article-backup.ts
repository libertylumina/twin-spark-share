import { supabase } from "@/integrations/supabase/client";
import type { Article } from "@/lib/articles";

export async function fetchBackupArticles(): Promise<Article[]> {
  const articles: Article[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as Article[];
    articles.push(...page);
    if (page.length < pageSize) return articles;
  }
}

export async function downloadArticleBackup() {
  const articles = await fetchBackupArticles();
  const createdAt = new Date().toISOString();
  const backup = {
    format: "central-de-bulas-articles",
    version: 1,
    created_at: createdAt,
    scope: "articles",
    includes_storage_files: false,
    includes_user_accounts: false,
    article_count: articles.length,
    articles,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-postagens-${createdAt.replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return articles.length;
}