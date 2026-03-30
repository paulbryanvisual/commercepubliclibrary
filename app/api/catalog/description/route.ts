import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { lookupGoogleBook } from "@/lib/catalog/google-books";

export const runtime = "nodejs";

/**
 * GET /api/catalog/description?id=123&title=...&author=...
 * or  /api/catalog/description?isbn=978...&olkey=/works/OL...
 *
 * Returns the book description, fetching from Open Library first,
 * then falling back to Google Books API. Caches in our DB.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const isbn = req.nextUrl.searchParams.get("isbn");
  const olkey = req.nextUrl.searchParams.get("olkey");
  const title = req.nextUrl.searchParams.get("title");
  const author = req.nextUrl.searchParams.get("author");

  if (!id && !isbn) {
    return NextResponse.json({ error: "Missing id or isbn" }, { status: 400 });
  }

  // 1. Check DB first
  if (id) {
    const { data } = await supabase
      .from("catalog_books")
      .select("description")
      .eq("id", parseInt(id))
      .single();

    if (data?.description) {
      return NextResponse.json({ description: data.description, source: "db" });
    }
  }

  // 2. Try Open Library
  let description: string | null = null;
  let source = "none";

  try {
    // Try work key first (most reliable for descriptions)
    if (olkey) {
      const workKey = olkey.startsWith("/works/") ? olkey : `/works/${olkey}`;
      const res = await fetch(`https://openlibrary.org${workKey}.json`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.description;
        description = typeof raw === "string" ? raw : raw?.value || null;
        if (description) source = "openlibrary";
      }
    }

    // Try ISBN → edition → work chain
    if (!description && isbn) {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.description;
        description = typeof raw === "string" ? raw : raw?.value || null;
        if (description) source = "openlibrary";

        // If edition has no description, try its work
        if (!description && data.works?.[0]?.key) {
          const wRes = await fetch(`https://openlibrary.org${data.works[0].key}.json`, {
            signal: AbortSignal.timeout(8000),
          });
          if (wRes.ok) {
            const wData = await wRes.json();
            const wRaw = wData.description;
            description = typeof wRaw === "string" ? wRaw : wRaw?.value || null;
            if (description) source = "openlibrary";
          }
        }
      }
    }
  } catch {
    // Open Library timeout/error — fall through to Google Books
  }

  // 3. Fall back to Google Books API
  if (!description) {
    try {
      const gbook = await lookupGoogleBook(isbn, title, author);
      if (gbook.description) {
        description = gbook.description;
        source = "googlebooks";
      }
    } catch {
      // Google Books timeout/error — continue
    }
  }

  if (description) {
    // Clean up markdown links: [text](url) → text
    description = description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    // Trim very long descriptions
    if (description.length > 1500) {
      description = description.slice(0, 1500).replace(/\s\S*$/, "") + "…";
    }

    // 4. Cache in DB
    if (id) {
      await supabase
        .from("catalog_books")
        .update({ description })
        .eq("id", parseInt(id))
        .then(() => {}); // fire and forget
    }
  }

  return NextResponse.json({
    description: description || null,
    source,
  });
}
