/** Fashion jewellery code from a subtitle such as "Code SS09" (null for other products). */
export const productCode = (subtitle: string | null | undefined) => subtitle?.match(/\bCode\s+([A-Z]{1,4}\s?\d{1,4})/i)?.[1].replace(/\s+/g, "").toUpperCase() ?? null;

/** "Title | tagline | more" → title + subtitle. */
export function splitTitle(raw: string) {
  const [title, ...rest] = raw.split("|").map((s) => s.trim());
  return { title, subtitle: rest.join(" · ") || null };
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

/** Store HTML → plain-text paragraphs (rendered as text, never as HTML). */
export function toParagraphs(html: string) {
  return decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 12);
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
