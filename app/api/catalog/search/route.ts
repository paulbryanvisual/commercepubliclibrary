import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ATRIUUM_BASE = "https://commercepubliclibrarytx.booksys.net/opac/cpltx";
const OPENLIBRARY_SEARCH = "https://openlibrary.org/search.json";

/**
 * GET /api/catalog/search?q=harry+potter&mode=suggest|full&limit=10
 *
 * mode=suggest (default): fast autocomplete from Atriuum OpenSearch
 * mode=full: enriched results from Open Library (covers, authors, ISBNs)
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

/** Fast autocomplete — hits Atriuum OpenSearch, returns title suggestions */
async function handleSuggest(q: string) {
  const url = `${ATRIUUM_BASE}/OpenSearch?json=t&term=${encodeURIComponent(q)}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min

  if (!res.ok) {
    return NextResponse.json({ results: [] });
  }

  const data = await res.json();
  // OpenSearch returns: ["query", ["Title 1", "Title 2", ...]]
  const titles: string[] = Array.isArray(data) && data.length > 1 ? data[1] : [];

  const results = titles.map((title) => ({
    title,
    opacUrl: `${ATRIUUM_BASE}/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(title)}`,
  }));

  return NextResponse.json({ results });
}

/** Full search — uses Open Library for rich book data (covers, ISBNs, descriptions) */
async function handleFull(q: string, limit: number) {
  const url = `${OPENLIBRARY_SEARCH}?q=${encodeURIComponent(q)}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,cover_i,subject,publisher,number_of_pages_median,edition_count`;
  const res = await fetch(url, { next: { revalidate: 600 } }); // cache 10 min

  if (!res.ok) {
    return NextResponse.json({ results: [] });
  }

  const data = await res.json();
  const docs = data.docs || [];

  const results = docs.map((doc: Record<string, unknown>) => {
    const isbn = Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null;
    const coverId = doc.cover_i as number | null;
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        : null;

    return {
      key: doc.key,
      title: doc.title,
      author: Array.isArray(doc.author_name) ? (doc.author_name as string[]).join(", ") : "Unknown",
      year: doc.first_publish_year || null,
      isbn,
      coverUrl,
      subjects: Array.isArray(doc.subject) ? (doc.subject as string[]).slice(0, 5) : [],
      publisher: Array.isArray(doc.publisher) ? (doc.publisher as string[])[0] : null,
      pages: doc.number_of_pages_median || null,
      editions: doc.edition_count || 1,
      opacUrl: `${ATRIUUM_BASE}/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(doc.title as string)}`,
    };
  });

  return NextResponse.json({
    results,
    total: data.numFound || 0,
    query: q,
  });
}
