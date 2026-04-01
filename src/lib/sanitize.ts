import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  // Text formatting
  "p", "br", "strong", "b", "em", "i", "u", "s", "del", "ins", "mark",
  "small", "sub", "sup", "code", "pre", "kbd", "samp", "var",
  // Headings
  "h1", "h2", "h3", "h4", "h5", "h6",
  // Lists
  "ul", "ol", "li",
  // Links & media
  "a", "img",
  // Tables
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  // Block
  "div", "span", "blockquote", "hr", "figure", "figcaption",
  // Description lists
  "dl", "dt", "dd",
];

const ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "alt", "width", "height", "loading",
  "class", "style",
  "id",
  "colspan", "rowspan", "scope",
];

/**
 * Sanitize HTML to prevent XSS attacks.
 * Uses DOMPurify with a strict allowlist of safe tags and attributes.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
