/**
 * Wraps an external book cover URL through our image proxy
 * so we don't depend on upstream servers (Open Library, etc).
 *
 * Returns null if the input is null/undefined.
 */
export function proxyCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already a local/relative URL — no need to proxy
  if (url.startsWith("/") || url.startsWith("data:")) return url;

  return `/api/catalog/image-proxy?url=${encodeURIComponent(url)}`;
}
