import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { proxyCoverUrl } from "@/lib/catalog/cover-proxy";
import { shouldFilterBook } from "@/lib/catalog/content-filter";

export const runtime = "nodejs";

/**
 * GET /api/catalog/browse?genre=Fiction&limit=50&offset=0&q=search+term
 *
 * Browse the local catalog_books table for instant discovery.
 * Supports genre filtering, text search, and pagination.
 */
export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre");
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
  const random = req.nextUrl.searchParams.get("random") === "true";

  try {
    let query = supabase
      .from("catalog_books")
      .select("*", { count: "exact" });

    // Genre filter — "Spanish" and "Graphic Novels" are virtual genres based on subjects
    if (genre === "Spanish") {
      // Match books with Spanish-language subject tags
      query = query.or(
        "subjects.cs.{Spanish language materials},subjects.cs.{Spanish language},subjects.cs.{Ficción},subjects.cs.{novela},subjects.cs.{español}"
      );
    } else if (genre === "Graphic Novels") {
      // Match books with graphic novel / comic subject tags
      query = query.or(
        "subjects.cs.{Graphic novels},subjects.cs.{graphic novel},subjects.cs.{Comic books, strips},subjects.cs.{Comics & graphic novels},subjects.cs.{manga},subjects.cs.{Cartoons and comics},subjects.cs.{Comics & Graphic Novels}"
      );
    } else if (genre === "Early Childhood") {
      query = query.eq("genre", "Early Childhood");
    } else if (genre && genre !== "all") {
      query = query.eq("genre", genre);
    }

    // Text search (title or author)
    if (q && q.length >= 2) {
      query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
    }

    // Random ordering for discovery / surprise me
    if (random) {
      // Get count first to pick a random offset
      let countQuery = supabase
        .from("catalog_books")
        .select("*", { count: "exact", head: true });
      if (genre === "Spanish") {
        countQuery = countQuery.or(
          "subjects.cs.{Spanish language materials},subjects.cs.{Spanish language},subjects.cs.{Ficción},subjects.cs.{novela},subjects.cs.{español}"
        );
      } else if (genre === "Graphic Novels") {
        countQuery = countQuery.or(
          "subjects.cs.{Graphic novels},subjects.cs.{graphic novel},subjects.cs.{Comic books, strips},subjects.cs.{Comics & graphic novels},subjects.cs.{manga},subjects.cs.{Cartoons and comics},subjects.cs.{Comics & Graphic Novels}"
        );
      } else if (genre && genre !== "all") {
        countQuery = countQuery.eq("genre", genre);
      }
      const { count: totalCount } = await countQuery;

      const total = totalCount || 0;
      const randomOffset = Math.max(0, Math.floor(Math.random() * Math.max(1, total - limit)));
      query = query.range(randomOffset, randomOffset + limit - 1);
    } else {
      query = query
        .order("year", { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Browse catalog error:", error);
      return NextResponse.json({ error: "Failed to browse catalog" }, { status: 500 });
    }

    const allBooks = (data || []).map((row) => ({
      id: row.id,
      isbn: row.isbn,
      title: row.title,
      author: row.author,
      year: row.year,
      genre: row.genre,
      description: row.description,
      subjects: row.subjects || [],
      coverUrl: proxyCoverUrl(row.cover_url, {
        isbn: row.isbn,
        title: row.title,
        author: row.author,
      }),
      publisher: row.publisher,
      pages: row.pages,
      openLibraryKey: row.open_library_key,
      available: row.available,
      totalCopies: row.total_copies,
      materialType: row.material_type,
      callNumber: row.call_number,
    }));

    // Filter out banned/NSFW/romance books and books without covers from browse
    // Also deduplicate by normalized title to avoid showing multiple editions
    const seenTitles = new Set<string>();
    const books = allBooks.filter((b) => {
      if (!b.coverUrl) return false;
      if (shouldFilterBook(b.title, b.subjects, b.genre, b.id, b.description)) return false;
      const normalizedTitle = b.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);
      return true;
    });

    return NextResponse.json({
      books,
      total: count || 0,
      offset,
      limit,
      genre: genre || "all",
    });
  } catch (err) {
    console.error("Browse catalog error:", err);
    return NextResponse.json({ error: "Failed to browse catalog" }, { status: 500 });
  }
}
