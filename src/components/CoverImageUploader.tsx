import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadCoverImage } from "@/lib/articles";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function validate(file: File): string | null {
  if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
    return "Formato inválido. Use JPG, PNG, WEBP ou AVIF.";
  }
  if (file.size > MAX_BYTES) {
    return `Arquivo muito grande (${formatSize(file.size)}). O limite é 5 MB.`;
  }
  return null;
}

export function CoverImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFile = async (file: File) => {
    const message = validate(file);
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setMeta({ name: file.name, size: file.size });

    const preview = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });

    setUploading(true);
    try {
      const url = await uploadCoverImage(file);
      onChange(url);
      toast.success("Imagem de capa enviada.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Erro ao enviar imagem.";
      setError(text);
      toast.error(text);
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMeta(null);
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMeta(null);
    setError(null);
    onChange("");
  };

  const preview = localPreview ?? (value || null);

  return (
    <div>
      <p className="text-sm font-semibold">Imagem de capa</p>
      <p className="mt-1 text-xs text-muted-foreground">
        JPG, PNG, WEBP ou AVIF · até 5 MB · recomendado 1200×675
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Enviar imagem de capa"
        onClick={() => !uploading && fileInput.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!uploading) fileInput.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`mt-3 cursor-pointer overflow-hidden rounded-lg border border-dashed transition-colors ${
          dragging ? "border-brand bg-secondary" : "border-border bg-secondary/40 hover:border-brand"
        }`}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Pré-visualização da imagem de capa"
              className="aspect-video w-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-medium">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
            <p className="text-xs text-muted-foreground">
              {uploading ? "Enviando…" : "Arraste uma imagem aqui ou clique para escolher"}
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />

      {meta && !error && (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {meta.name} · {formatSize(meta.size)}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="mr-1 h-4 w-4" />
          {value || preview ? "Trocar imagem" : "Enviar imagem"}
        </Button>
        {(value || preview) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={uploading}
            onClick={clear}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Remover
          </Button>
        )}
      </div>

      <div className="mt-3">
        <Label htmlFor="cover-url" className="text-xs text-muted-foreground">
          ou cole uma URL
        </Label>
        <Input
          id="cover-url"
          className="mt-1.5"
          placeholder="https://…"
          value={value}
          onChange={(event) => {
            setLocalPreview((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return null;
            });
            setMeta(null);
            setError(null);
            onChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}
