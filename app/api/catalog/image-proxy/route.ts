import { NextRequest, NextResponse } from "next/server";
import { lookupGoogleBook } from "@/lib/catalog/google-books";

export const runtime = "nodejs";

/**
 * GET /api/catalog/image-proxy?url=https://covers.openlibrary.org/b/isbn/...
 *
 * Proxies and caches external book cover images so we don't depend on
 * upstream servers being available. Responses are cached for 30 days
 * via Cache-Control headers (Vercel edge + browser).
 */

// In-memory cache for the Node process lifetime (useful for dev / serverless warm starts)
const memoryCache = new Map<string, { buffer: ArrayBuffer; contentType: string; timestamp: number }>();
const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function pruneCache() {
  if (memoryCache.size <= MAX_CACHE_SIZE) return;
  // Remove oldest entries
  const entries = Array.from(memoryCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
  for (const [key] of toRemove) {
    memoryCache.delete(key);
  }
}

const ALLOWED_HOSTS = [
  "covers.openlibrary.org",
  "images.unsplash.com",
  "books.google.com",
  "books.googleusercontent.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Allow any Internet Archive host (ia*.us.archive.org)
    if (/^ia\d+\.us\.archive\.org$/.test(parsed.hostname)) return true;
    return ALLOWED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Fetch an image and validate it's a real cover (not a placeholder).
 * Returns { buffer, contentType } or null.
 */
async function fetchAndValidateImage(imageUrl: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "CommercePublicLibrary/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = await response.arrayBuffer();
    // Reject tiny placeholders (OL returns a ~43-byte transparent GIF for missing covers)
    if (buffer.byteLength < 1000) return null;

    return { buffer, contentType };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  // Optional fallback params — used to try Google Books when OL has no cover
  const isbn = req.nextUrl.searchParams.get("isbn");
  const title = req.nextUrl.searchParams.get("title");
  const author = req.nextUrl.searchParams.get("author");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "URL host not allowed" }, { status: 403 });
  }

  // Check memory cache
  const cached = memoryCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return new Response(cached.buffer, {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    // 1. Try the primary URL (usually Open Library)
    let result = await fetchAndValidateImage(url);

    // 2. If primary failed, try Google Books as fallback
    if (!result && (isbn || title)) {
      try {
        const gbook = await lookupGoogleBook(isbn, title, author);
        if (gbook.coverUrl) {
          result = await fetchAndValidateImage(gbook.coverUrl);
        }
      } catch {
        // Google Books fallback failed — continue to 404
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "No cover available" },
        {
          status: 404,
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        }
      );
    }

    // Store in memory cache
    memoryCache.set(url, { buffer: result.buffer, contentType: result.contentType, timestamp: Date.now() });
    pruneCache();

    return new Response(result.buffer, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
