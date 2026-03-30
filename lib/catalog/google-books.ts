/**
 * Google Books API helper — used as a fallback when Open Library
 * doesn't have a cover or description for a book.
 *
 * Free, no API key required for basic volume search.
 * https://developers.google.com/books/docs/v1/using
 */

interface GoogleBookResult {
  coverUrl: string | null;
  description: string | null;
  title: string | null;
}

/**
 * Look up a book on Google Books by ISBN, returning its cover URL
 * and description if available.
 */
export async function lookupGoogleBook(
  isbn?: string | null,
  title?: string | null,
  author?: string | null,
): Promise<GoogleBookResult> {
  const empty: GoogleBookResult = { coverUrl: null, description: null, title: null };

  // Build query — prefer ISBN, fall back to title+author
  let q = "";
  if (isbn) {
    q = `isbn:${isbn}`;
  } else if (title) {
    q = `intitle:${title}`;
    if (author) q += `+inauthor:${author}`;
  } else {
    return empty;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1&fields=items(volumeInfo)`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "CommercePublicLibrary/1.0" },
      },
    );

    if (!res.ok) return empty;

    const data = await res.json();
    const vol = data.items?.[0]?.volumeInfo;
    if (!vol) return empty;

    // Get the largest available thumbnail
    // Google returns http:// URLs — upgrade to https
    let coverUrl: string | null = null;
    const imgs = vol.imageLinks;
    if (imgs) {
      const raw = imgs.extraLarge || imgs.large || imgs.medium || imgs.small || imgs.thumbnail || imgs.smallThumbnail;
      if (raw) {
        coverUrl = raw.replace(/^http:/, "https:").replace(/&edge=curl/g, "");
      }
    }

    // Description — Google returns it as HTML, strip tags for plain text
    let description: string | null = vol.description || null;
    if (description) {
      // Strip HTML tags
      description = description.replace(/<[^>]+>/g, "");
      // Decode common HTML entities
      description = description
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    }

    return {
      coverUrl,
      description,
      title: vol.title || null,
    };
  } catch {
    return empty;
  }
}
