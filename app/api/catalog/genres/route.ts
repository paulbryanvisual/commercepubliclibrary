import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/catalog/genres
 *
 * Returns genre names and counts from the catalog_books table.
 * Cached for 5 minutes via ISR.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("catalog_books")
      .select("genre");

    if (error) {
      console.error("Genre count error:", error);
      return NextResponse.json({ genres: [] }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.genre] = (counts[row.genre] || 0) + 1;
    }

    const genres = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const total = genres.reduce((sum, g) => sum + g.count, 0);

    return NextResponse.json({ genres, total }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("Genre count error:", err);
    return NextResponse.json({ genres: [] }, { status: 500 });
  }
}
