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

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",;\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function articlesToCsv(articles: Article[]): string {
  const columns = Array.from(
    articles.reduce((set, a) => {
      Object.keys(a as Record<string, unknown>).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const rows = articles.map((a) =>
    columns.map((c) => csvCell((a as Record<string, unknown>)[c])).join(","),
  );
  return [columns.join(","), ...rows].join("\r\n");
}

export async function downloadArticleBackup() {
  const articles = await fetchBackupArticles();
  const createdAt = new Date().toISOString();
  const csv = "\uFEFF" + articlesToCsv(articles);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-postagens-${createdAt.replace(/[:.]/g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return articles.length;
}
