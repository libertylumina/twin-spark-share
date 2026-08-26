import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  Bold,
  Code,
  Code2,
  Eye,
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeArticleHtml } from "@/lib/sanitize";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-40",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      isParagraph: e.isActive("paragraph"),
      isH1: e.isActive("heading", { level: 1 }),
      isH2: e.isActive("heading", { level: 2 }),
      isH3: e.isActive("heading", { level: 3 }),
      isBold: e.isActive("bold"),
      isItalic: e.isActive("italic"),
      isUnderline: e.isActive("underline"),
      isStrike: e.isActive("strike"),
      isBulletList: e.isActive("bulletList"),
      isOrderedList: e.isActive("orderedList"),
      isBlockquote: e.isActive("blockquote"),
      isCodeBlock: e.isActive("codeBlock"),
      isLink: e.isActive("link"),
      isSuperscript: e.isActive("superscript"),
      isSubscript: e.isActive("subscript"),
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/60 px-2 py-1.5">
      <ToolButton label="Desfazer" onClick={() => editor.chain().focus().undo().run()} disabled={!state.canUndo}>
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Refazer" onClick={() => editor.chain().focus().redo().run()} disabled={!state.canRedo}>
        <Redo2 className="h-4 w-4" />
      </ToolButton>
      <Divider />
      <ToolButton
        label="Parágrafo"
        active={state.isParagraph}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Título 1"
        active={state.isH1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Título 2"
        active={state.isH2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Título 3"
        active={state.isH3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolButton>
      <Divider />
      <ToolButton label="Negrito" active={state.isBold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Itálico" active={state.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Sublinhado"
        active={state.isUnderline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Riscado" active={state.isStrike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </ToolButton>
      <Divider />
      <ToolButton
        label="Lista com marcadores"
        active={state.isBulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Lista numerada"
        active={state.isOrderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Citação"
        active={state.isBlockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Bloco de código"
        active={state.isCodeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Linha divisória" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Inserir tabela"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableIcon className="h-4 w-4" />
      </ToolButton>
      <Divider />
      <ToolButton
        label="Sobrescrito"
        active={state.isSuperscript}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <span className="text-xs font-semibold">x²</span>
      </ToolButton>
      <ToolButton
        label="Subscrito"
        active={state.isSubscript}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <span className="text-xs font-semibold">x₂</span>
      </ToolButton>
      <Divider />
      <ToolButton
        label="Inserir link"
        active={state.isLink}
        onClick={() => {
          const previous = editor.getAttributes("link")["href"] as string | undefined;
          const url = window.prompt("URL do link", previous ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Remover link"
        disabled={!state.isLink}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Unlink className="h-4 w-4" />
      </ToolButton>
    </div>
  );
}

export function RichTextEditor({ value, onChange }: Props) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [draftHtml, setDraftHtml] = useState(value || "");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Superscript,
      Subscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose-article min-h-[320px] overflow-x-auto px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (htmlMode) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value, htmlMode]);

  const previewHtml = htmlMode ? draftHtml : value || "";

  function toggleHtmlMode() {
    if (!editor) return;
    if (htmlMode) {
      editor.commands.setContent(draftHtml, { emitUpdate: false });
      onChange(editor.getHTML());
      setHtmlMode(false);
    } else {
      setDraftHtml(editor.getHTML());
      setHtmlMode(true);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/60">
        <div className="min-w-0 flex-1">{editor && !htmlMode && <Toolbar editor={editor} />}</div>
        <div className="mr-2 flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              showPreview && "bg-accent text-accent-foreground",
            )}
          >
            {showPreview ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Prévia
          </button>
          <button
            type="button"
            onClick={toggleHtmlMode}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              htmlMode && "bg-accent text-accent-foreground",
            )}
          >
            <Code2 className="h-3.5 w-3.5" />
            HTML
          </button>
        </div>
      </div>
      <div className={cn("grid", showPreview && "lg:grid-cols-2")}>
        <div className={cn("min-w-0", showPreview && "lg:border-r lg:border-border")}>
          {htmlMode ? (
            <Textarea
              value={draftHtml}
              onChange={(e) => {
                setDraftHtml(e.target.value);
                onChange(e.target.value);
              }}
              spellCheck={false}
              className="min-h-[320px] rounded-none border-0 font-mono text-xs focus-visible:ring-0"
              placeholder="Cole ou edite o HTML aqui (tabelas, <sup>, <br>, etc.)"
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
        {showPreview && (
          <div className="min-w-0 border-t border-border bg-background/60 lg:border-t-0">
            <p className="border-b border-border px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Pré-visualização
            </p>
            {previewHtml.trim() ? (
              <div
                className="prose-article max-w-none overflow-x-auto px-4 py-3 text-[15px]"
                dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(previewHtml) }}
              />
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Comece a escrever para ver o resultado aqui.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
