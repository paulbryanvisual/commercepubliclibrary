import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const ATRIUUM_BASE = "https://commercepubliclibrarytx.booksys.net/opac/cpltx";
const OPENLIBRARY_SEARCH = "https://openlibrary.org/search.json";

/**
 * GET /api/catalog/search?q=harry+potter&mode=suggest|full&limit=10
 *
 * mode=suggest (default): fast autocomplete from local catalog + Atriuum OpenSearch
 * mode=full: local catalog results first, supplemented by Open Library
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const mode = req.nextUrl.searchParams.get("mode") || "suggest";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "10"), 30);

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    if (mode === "suggest") {
      return await handleSuggest(q);
    } else {
      return await handleFull(q, limit);
    }
  } catch (err) {
    console.error("Catalog search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

/** Fast autocomplete — hits local catalog first, then Atriuum OpenSearch */
async function handleSuggest(q: string) {
  // Search local catalog for instant results
  const { data: localBooks } = await supabase
    .from("catalog_books")
    .select("title, author, cover_url")
    .or(`title.ilike.%${q}%,author.ilike.%${q}%`)
    .limit(8);

  const localResults = (localBooks || []).map((b) => ({
    title: b.title,
    author: b.author,
    coverUrl: b.cover_url,
    opacUrl: `${ATRIUUM_BASE}/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(b.title)}`,
  }));

  // Also try Atriuum for books not in our local catalog
  try {
    const url = `${ATRIUUM_BASE}/OpenSearch?json=t&term=${encodeURIComponent(q)}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const titles: string[] = Array.isArray(data) && data.length > 1 ? data[1] : [];
      const localTitles = new Set(localResults.map((r) => r.title.toLowerCase()));
      for (const title of titles) {
        if (!localTitles.has(title.toLowerCase())) {
          localResults.push({
            title,
            author: undefined as unknown as string,
            coverUrl: undefined as unknown as string,
            opacUrl: `${ATRIUUM_BASE}/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(title)}`,
          });
        }
      }
    }
  } catch { /* Atriuum unavailable — use local only */ }

  return NextResponse.json({ results: localResults });
}

/** Full search — local catalog first, supplemented by Open Library */
async function handleFull(q: string, limit: number) {
  // Search local catalog (instant)
  const { data: localBooks, count: localCount } = await supabase
    .from("catalog_books")
    .select("*", { count: "exact" })
    .or(`title.ilike.%${q}%,author.ilike.%${q}%`)
    .order("year", { ascending: false, nullsFirst: false })
    .limit(limit);

  const localResults = (localBooks || []).map((row) => ({
    key: row.open_library_key,
    title: row.title,
    author: row.author || "Unknown",
    year: row.year || null,
    isbn: row.isbn,
    coverUrl: row.cover_url,
    subjects: row.subjects || [],
    publisher: row.publisher,
    pages: row.pages,
    editions: 1,
    genre: row.genre,
    description: row.description,
    source: "local" as const,
    opacUrl: `${ATRIUUM_BASE}/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(row.title)}`,
  }));

  // If local results are sufficient, return them
  if (localResults.length >= limit) {
    return NextResponse.json({
      results: localResults.slice(0, limit),
      total: localCount || localResults.length,
      query: q,
    });
  }

  // Supplement with Open Library for more results
  const olLimit = limit - localResults.length;
  let olResults: typeof localResults = [];
  let olTotal = 0;

  try {
    const url = `${OPENLIBRARY_SEARCH}?q=${encodeURIComponent(q)}&limit=${olLimit}&fields=key,title,author_name,first_publish_year,isbn,cover_i,subject,publisher,number_of_pages_median,edition_count`;
    const res = await fetch(url, { next: { revalidate: 600 } });

    if (res.ok) {
      const data = await res.json();
      const docs = data.docs || [];
      olTotal = data.numFound || 0;

      // Deduplicate against local results
      const localTitles = new Set(localResults.map((r) => r.title.toLowerCase()));

      olResults = docs
        .filter((doc: Record<string, unknown>) => !localTitles.has((doc.title as string || "").toLowerCase()))
        .map((doc: Record<string, unknown>) => {
          const isbn = Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null;
          const coverId = doc.cover_i as number | null;
          const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
            : isbn
              ? `https://covers.openlibrary.org/b/isbn/${isbn as string}-M.jpg`
              : null;

          return {
            key: doc.key as string,
            title: doc.title as string,
            author: Array.isArray(doc.author_name) ? (doc.author_name as string[]).join(", ") : "Unknown",
            year: (doc.first_publish_year as number) || null,
            isbn: isbn as string | null,
            coverUrl,
            subjects: Array.isArray(doc.subject) ? (doc.subject as string[]).slice(0, 5) : [],
            publisher: Array.isArray(doc.publisher) ? (doc.publisher as string[])[0] : null,
            pages: (doc.number_of_pages_median as number) || null,
            editions: (doc.edition_count as number) || 1,
            genre: undefined as string | undefined,
            description: undefined as string | undefined,
            source: "openlibrary" as const,
            opacUrl: `${ATRIUUM_BASE}/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(doc.title as string)}`,
          };
        });
    }
  } catch { /* Open Library unavailable — use local only */ }

  const combined = [...localResults, ...olResults].slice(0, limit);

  return NextResponse.json({
    results: combined,
    total: Math.max(localCount || 0, olTotal),
    query: q,
  });
}
