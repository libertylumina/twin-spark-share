/**
 * Normaliza HTML de bulas colado de fontes externas:
 * - reconverte tags inline escapadas (&lt;sup&gt; -> <sup>)
 * - converte tabelas em markdown (linhas com "|") em <table> real
 */

const INLINE_TAGS = "sup|sub|br|strong|b|em|i|u|s|del|small";

function unescapeInlineTags(html: string): string {
  const re = new RegExp(`&lt;(/?)(${INLINE_TAGS})\\s*/?&gt;`, "gi");
  return html.replace(re, (_m, slash: string, tag: string) => `<${slash}${tag.toLowerCase()}>`);
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

const isSeparator = (line: string) =>
  /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim());

const isRow = (line: string) => {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.includes("|", 1);
};

function buildTable(rows: string[]): string {
  const parsed = rows.filter((r) => !isSeparator(r)).map(splitRow);
  if (parsed.length === 0) return "";
  const hasHeader = rows.length > 1 && isSeparator(rows[1] ?? "");
  const width = Math.max(...parsed.map((r) => r.length));
  const pad = (cells: string[]) => [...cells, ...Array(Math.max(0, width - cells.length)).fill("")];
  const cell = (tag: string, value: string) => `<${tag}>${value || "&nbsp;"}</${tag}>`;

  let html = "<table>";
  let body = parsed;
  if (hasHeader) {
    html += `<thead><tr>${pad(parsed[0]!).map((c) => cell("th", c)).join("")}</tr></thead>`;
    body = parsed.slice(1);
  }
  html += `<tbody>${body
    .map((r) => `<tr>${pad(r).map((c) => cell("td", c)).join("")}</tr>`)
    .join("")}</tbody>`;
  return `${html}</table>`;
}

/** Converte blocos de linhas markdown com pipes (em <p> ou texto puro) em tabelas HTML. */
function convertMarkdownTables(html: string): string {
  // extrai o texto de cada <p> como "linha" candidata, preservando os demais blocos
  const tokens = html.split(/(<p[^>]*>[\s\S]*?<\/p>|\r?\n)/g).filter((t) => t !== "");
  const out: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const rows = buffer.filter((r) => !isSeparator(r));
    out.push(rows.length >= 1 ? buildTable(buffer) : "");
    buffer = [];
  };

  for (const token of tokens) {
    const inner = token.replace(/^<p[^>]*>/, "").replace(/<\/p>$/, "");
    const plain = inner.replace(/<br\s*\/?>/gi, " ").trim();
    if (isRow(plain) || (buffer.length > 0 && isSeparator(plain))) {
      buffer.push(plain);
      continue;
    }
    flush();
    out.push(token);
  }
  flush();
  return out.join("");
}

export function normalizeArticleHtml(html: string): string {
  if (!html) return html;
  return convertMarkdownTables(unescapeInlineTags(html));
}
