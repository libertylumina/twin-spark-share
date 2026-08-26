import DOMPurify from "isomorphic-dompurify";
import { normalizeArticleHtml } from "./rich-html";

const ALLOWED_TAGS = [
  "p","br","hr","strong","b","em","i","u","s","del","sup","sub","code","pre","blockquote",
  "h1","h2","h3","h4","h5","h6","ul","ol","li","a","img","span","div",
  "table","thead","tbody","tfoot","tr","th","td","caption","colgroup","col",
];

const ALLOWED_ATTR = [
  "href","target","rel","title","alt","src","width","height","colspan","rowspan","align","class","style",
];

/** Sanitiza HTML de bulas: remove scripts, handlers e URLs inseguras. */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(normalizeArticleHtml(html), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/|data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,)/i,
    FORBID_TAGS: ["script","style","iframe","object","embed","form","input","button","link","meta","base"],
    FORBID_ATTR: ["onerror","onload","onclick","onmouseover","formaction","srcdoc"],
    ADD_ATTR: ["target"],
    USE_PROFILES: { html: true },
  });
}
