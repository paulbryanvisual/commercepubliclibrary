import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const PATRON_SECRET = new TextEncoder().encode(
  process.env.PATRON_JWT_SECRET || process.env.SESSION_SECRET || "patron-fallback-secret"
);
const PATRON_COOKIE = "cpl_patron_session";

async function getPatronCard(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PATRON_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, PATRON_SECRET);
    return (payload.cardNumber as string) || (payload.patronId as string) || null;
  } catch {
    return null;
  }
}

/** GET — list saved books for the logged-in patron */
export async function GET() {
  const card = await getPatronCard();
  if (!card) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("patron_saved_books")
    .select("*")
    .eq("patron_card", card)
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("Saved books fetch error:", error);
    return NextResponse.json({ error: "Failed to load saved books" }, { status: 500 });
  }

  return NextResponse.json({
    books: (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      isbn: row.isbn,
      coverUrl: row.cover_url,
      year: row.year,
      subjects: row.subjects || [],
      publisher: row.publisher,
      pages: row.pages,
      openLibraryKey: row.open_library_key,
      savedAt: row.saved_at,
    })),
  });
}

/** POST — save a book to the patron's list */
export async function POST(req: NextRequest) {
  const card = await getPatronCard();
  if (!card) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { title, author, isbn, coverUrl, year, subjects, publisher, pages, openLibraryKey } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("patron_saved_books")
    .upsert(
      {
        patron_card: card,
        title,
        author: author || null,
        isbn: isbn || null,
        cover_url: coverUrl || null,
        year: year || null,
        subjects: subjects || [],
        publisher: publisher || null,
        pages: pages || null,
        open_library_key: openLibraryKey || null,
      },
      { onConflict: "patron_card,title,coalesce(author, '')" }
    )
    .select()
    .single();

  if (error) {
    // Handle unique constraint with a simpler upsert fallback
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, message: "Already saved" });
    }
    console.error("Save book error:", error);
    return NextResponse.json({ error: "Failed to save book" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id, message: "Book saved to your list!" });
}

/** DELETE — remove a book from the patron's list */
export async function DELETE(req: NextRequest) {
  const card = await getPatronCard();
  if (!card) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const title = searchParams.get("title");

  const sb = createServiceClient();

  if (id) {
    const { error } = await sb
      .from("patron_saved_books")
      .delete()
      .eq("id", id)
      .eq("patron_card", card);

    if (error) {
      console.error("Delete saved book error:", error);
      return NextResponse.json({ error: "Failed to remove book" }, { status: 500 });
    }
  } else if (title) {
    const { error } = await sb
      .from("patron_saved_books")
      .delete()
      .eq("patron_card", card)
      .eq("title", title);

    if (error) {
      console.error("Delete saved book error:", error);
      return NextResponse.json({ error: "Failed to remove book" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "id or title is required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Book removed from your list" });
}
