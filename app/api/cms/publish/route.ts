import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";
import { supabase } from "@/lib/supabase";
import { publishItem, publishAllDrafts, discardDraft, getDraftCount } from "@/lib/cms/dataStore";

export const runtime = "nodejs";

const VALID_TABLES = ["events", "announcements", "staff_picks", "closures", "hours_overrides", "page_content"];

/** GET: Get count of pending drafts */
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await getDraftCount();
  return NextResponse.json({ draftCount: count });
}

/** POST: Publish or discard drafts */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action: string; table?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, table, id } = body;

  try {
    switch (action) {
      case "publish": {
        if (!table || !id) {
          return NextResponse.json({ error: "table and id required" }, { status: 400 });
        }
        if (!VALID_TABLES.includes(table)) {
          return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
        }
        await publishItem(table, id);

        // Audit log
        await supabase.from("audit_log").insert({
          user_id: session.userId,
          user_name: session.displayName,
          action: `Published ${table} item`,
          tool_name: "publish",
          tool_input: { table, id },
          result: { status: "published" },
        });

        return NextResponse.json({ success: true, message: `Published to live site` });
      }

      case "publish_all": {
        const result = await publishAllDrafts();

        await supabase.from("audit_log").insert({
          user_id: session.userId,
          user_name: session.displayName,
          action: `Published all drafts (${result.count} items)`,
          tool_name: "publish_all",
          tool_input: {},
          result,
        });

        return NextResponse.json({ success: true, ...result });
      }

      case "discard": {
        if (!table || !id) {
          return NextResponse.json({ error: "table and id required" }, { status: 400 });
        }
        if (!VALID_TABLES.includes(table)) {
          return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
        }
        await discardDraft(table, id);

        await supabase.from("audit_log").insert({
          user_id: session.userId,
          user_name: session.displayName,
          action: `Discarded draft from ${table}`,
          tool_name: "discard",
          tool_input: { table, id },
          result: { status: "discarded" },
        });

        return NextResponse.json({ success: true, message: "Draft discarded" });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
