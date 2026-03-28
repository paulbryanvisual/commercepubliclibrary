import { NextRequest, NextResponse } from "next/server";

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
  const entries = [...memoryCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
  for (const [key] of toRemove) {
    memoryCache.delete(key);
  }
}

const ALLOWED_HOSTS = [
  "covers.openlibrary.org",
  "images.unsplash.com",
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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

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
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CommercePublicLibrary/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Only proxy images
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    // Store in memory cache
    memoryCache.set(url, { buffer, contentType, timestamp: Date.now() });
    pruneCache();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
