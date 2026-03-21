import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";

export const runtime = "nodejs";

/**
 * One-time migration endpoint to add `status` column to CMS tables.
 * Run once from the admin panel, then this endpoint can be removed.
 */
export async function POST(request: NextRequest) {
  // Auth check
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const sql = `
    ALTER TABLE events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
    ALTER TABLE staff_picks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
    ALTER TABLE closures ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
    ALTER TABLE hours_overrides ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
    ALTER TABLE page_content ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
    CREATE INDEX IF NOT EXISTS idx_staff_picks_status ON staff_picks(status);
    CREATE INDEX IF NOT EXISTS idx_page_content_status ON page_content(status);
  `;

  try {
    // Try using the Supabase SQL API (requires service_role key)
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      return NextResponse.json({
        error: "Migration requires running SQL manually in Supabase Dashboard",
        sql,
        instructions: "Go to Supabase Dashboard → SQL Editor → New Query → paste the SQL above → Run",
      });
    }

    return NextResponse.json({ success: true, message: "Migration completed" });
  } catch {
    return NextResponse.json({
      error: "Migration requires running SQL manually in Supabase Dashboard",
      sql,
      instructions: "Go to Supabase Dashboard → SQL Editor → New Query → paste the SQL above → Run",
    });
  }
}
