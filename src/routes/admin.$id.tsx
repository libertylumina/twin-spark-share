import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Facebook, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CoverImageUploader } from "@/components/CoverImageUploader";
import {
  articleByIdQuery,
  createArticle,
  fromLocalInputValue,
  slugify,
  toLocalInputValue,
  updateArticle,
  type ArticleInput,
} from "@/lib/articles";

export const Route = createFileRoute("/admin/$id")({
  component: AdminEditor,
});

const emptyForm: ArticleInput = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author_name: "",
  tags: [],
  published: false,
  cover_image_url: "",
  share_facebook: "",
  share_twitter: "",
  share_whatsapp: "",
  share_linkedin: "",
  published_at: new Date().toISOString(),
};

function AdminEditor() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery({
    ...articleByIdQuery(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState<ArticleInput>(emptyForm);
  const [product, setProduct] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [hydrated, setHydrated] = useState(isNew);

  useEffect(() => {
    if (isNew || !article || hydrated) return;
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      author_name: article.author_name,
      tags: article.tags,
      published: article.published,
      cover_image_url: article.cover_image_url,
      share_facebook: article.share_facebook,
      share_twitter: article.share_twitter,
      share_whatsapp: article.share_whatsapp,
      share_linkedin: article.share_linkedin,
      published_at: article.published_at,
    });
    setProduct(article.tags[0] ?? "");
    setTagsText(article.tags.slice(1).join(", "));
    setHydrated(true);
  }, [article, hydrated, isNew]);

  const set = <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isScheduled =
    form.published && new Date(form.published_at).getTime() > Date.now();

  const save = useMutation({
    mutationFn: async () => {
      const extraTags = tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload: ArticleInput = {
        ...form,
        slug: form.slug || slugify(form.title),
        tags: [product.trim(), ...extraTags].filter(Boolean),
      };
      if (isNew) await createArticle(payload);
      else await updateArticle(id, payload);
    },
    onSuccess: async () => {
      toast.success(isNew ? "Postagem criada." : "Postagem atualizada.");
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
      void navigate({ to: "/admin" });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Erro ao salvar."),
  });

  if (!isNew && isLoading) {
    return <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-muted-foreground">Carregando…</div>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para as postagens
        </Link>
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
            {isNew ? "Criar postagem" : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* main column */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product">Produto</Label>
              <Input
                id="product"
                required
                placeholder="Ex.: Lúmina 500 mg"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Usado para filtrar as bulas por produto na Central de Bulas.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="published_at_main">Data da bula</Label>
              <Input
                id="published_at_main"
                type="datetime-local"
                value={toLocalInputValue(form.published_at)}
                onChange={(e) => set("published_at", fromLocalInputValue(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Data exibida ao público e usada na ordenação.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              required
              placeholder="Ex.: Bula atualizada — Lúmina 500 mg"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: isNew && !prev.slug ? slugify(title) : prev.slug,
                }));
              }}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Label htmlFor="excerpt">Resumo</Label>
            <Textarea
              id="excerpt"
              rows={3}
              placeholder="Resumo curto exibido na lista"
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Label>Conteúdo da bula</Label>
            <RichTextEditor value={form.content} onChange={(html) => set("content", html)} />
          </div>
        </div>

        {/* sidebar */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Publicado</p>
                <p className="text-xs text-muted-foreground">Visível em /</p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(checked) => set("published", checked)}
                aria-label="Publicado"
              />
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs text-muted-foreground">
                {isScheduled
                  ? "Agendado: ficará público automaticamente nessa data."
                  : form.published
                    ? "Já disponível ao público."
                    : "Rascunho: só fica público quando você ativar a publicação."}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 px-0 text-xs"
                onClick={() => set("published_at", new Date().toISOString())}
              >
                Publicar agora
              </Button>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                className="mt-2"
                required
                placeholder="meu-post"
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                /bulas/{form.slug || "meu-post"}
              </p>
            </div>

            <div className="mt-4">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                className="mt-2"
                placeholder="Nome do autor"
                value={form.author_name}
                onChange={(e) => set("author_name", e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="tags">Outras categorias</Label>
              <Input
                id="tags"
                className="mt-2"
                placeholder="separadas por vírgula"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Opcional — o produto já é adicionado automaticamente.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <CoverImageUploader
              value={form.cover_image_url}
              onChange={(url) => set("cover_image_url", url)}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-semibold">Links de compartilhamento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Opcional. Se necessário, substitua o link padrão de cada botão de partilha do post.
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <ShareField
                icon={<Facebook className="h-3.5 w-3.5" />}
                label="Facebook"
                placeholder="https://facebook.com/..."
                value={form.share_facebook}
                onChange={(value) => set("share_facebook", value)}
              />
              <ShareField
                icon={<Twitter className="h-3.5 w-3.5" />}
                label="Twitter / X"
                placeholder="https://x.com/..."
                value={form.share_twitter}
                onChange={(value) => set("share_twitter", value)}
              />
              <ShareField
                icon={<MessageCircle className="h-3.5 w-3.5" />}
                label="WhatsApp"
                placeholder="https://wa.me/..."
                value={form.share_whatsapp}
                onChange={(value) => set("share_whatsapp", value)}
              />
              <ShareField
                icon={<Linkedin className="h-3.5 w-3.5" />}
                label="LinkedIn"
                placeholder="https://linkedin.com/..."
                value={form.share_linkedin}
                onChange={(value) => set("share_linkedin", value)}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function ShareField({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <Input
        className="mt-2"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
