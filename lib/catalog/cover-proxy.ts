/**
 * Wraps an external book cover URL through our image proxy
 * so we don't depend on upstream servers (Open Library, etc).
 *
 * Optionally pass isbn/title/author so the proxy can fall back
 * to Google Books if the primary source has no cover.
 *
 * Returns null if the input is null/undefined.
 */
export function proxyCoverUrl(
  url: string | null | undefined,
  meta?: { isbn?: string | null; title?: string | null; author?: string | null },
): string | null {
  if (!url) return null;

  // Already a local/relative URL — no need to proxy
  if (url.startsWith("/") || url.startsWith("data:")) return url;

  const params = new URLSearchParams({ url });
  if (meta?.isbn) params.set("isbn", meta.isbn);
  if (meta?.title) params.set("title", meta.title);
  if (meta?.author) params.set("author", meta.author);

  return `/api/catalog/image-proxy?${params.toString()}`;
}
