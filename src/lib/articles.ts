import { supabase } from "@/integrations/supabase/client";

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  tags: string[];
  published: boolean;
  cover_image_url: string;
  share_facebook: string;
  share_twitter: string;
  share_whatsapp: string;
  share_linkedin: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  tags: string[];
  published: boolean;
  cover_image_url: string;
  share_facebook: string;
  share_twitter: string;
  share_whatsapp: string;
  share_linkedin: string;
  published_at: string;
};

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export type ArticleStatus = "rascunho" | "agendado" | "publicado";

export function articleStatus(article: Pick<Article, "published" | "published_at">): ArticleStatus {
  if (!article.published) return "rascunho";
  return new Date(article.published_at).getTime() > Date.now() ? "agendado" : "publicado";
}

export const statusLabel: Record<ArticleStatus, string> = {
  rascunho: "Rascunho",
  agendado: "Agendado",
  publicado: "Publicado",
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO string -> value for <input type="datetime-local"> in local time */
export function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInputValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateParts(iso: string) {
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    year: String(date.getFullYear()),
  };
}

export const publishedArticlesQuery = {
  queryKey: ["articles", "published"] as const,
  queryFn: async (): Promise<Article[]> => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("published", true)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Article[];
  },
};

export const allArticlesQuery = {
  queryKey: ["articles", "all"] as const,
  queryFn: async (): Promise<Article[]> => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Article[];
  },
};

export function articleBySlugQuery(slug: string) {
  return {
    queryKey: ["articles", "slug", slug] as const,
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      return (data as Article) ?? null;
    },
  };
}

export async function createArticle(input: ArticleInput) {
  const { error } = await supabase.from("articles").insert(input);
  if (error) throw error;
}

export async function updateArticle(id: string, input: ArticleInput) {
  const { error } = await supabase.from("articles").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteArticle(id: string) {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}

export function articleByIdQuery(id: string) {
  return {
    queryKey: ["articles", "id", id] as const,
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Article) ?? null;
    },
  };
}

const COVER_BUCKET = "article-images";

export async function uploadCoverImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from(COVER_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signError) throw signError;
  return data.signedUrl;
}

export function isHtmlContent(content: string) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|strong|em|pre|hr|a)\b/i.test(content);
}