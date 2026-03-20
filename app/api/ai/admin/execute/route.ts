import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";
import { supabase } from "@/lib/supabase";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  addAnnouncement,
  addStaffPick,
  addClosure,
  updateHours,
  updatePageContent,
} from "@/lib/cms/dataStore";

export const runtime = "nodejs";

interface ExecuteRequest {
  toolName: string;
  toolInput: Record<string, unknown>;
}

/** Log an action to the audit_log table */
async function logAudit(
  userId: string,
  userName: string,
  action: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  result: unknown
) {
  await supabase.from("audit_log").insert({
    user_id: userId,
    user_name: userName,
    action,
    tool_name: toolName,
    tool_input: toolInput,
    result: result as Record<string, unknown>,
  });
}

export async function POST(request: NextRequest) {
  // Auth check — now returns full session payload with user info
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ExecuteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { toolName, toolInput } = body;

  if (!toolName || !toolInput) {
    return NextResponse.json(
      { error: "toolName and toolInput are required" },
      { status: 400 }
    );
  }

  try {
    let result: unknown;
    let action = "unknown";

    switch (toolName) {
      case "create_event":
        action = "Created event";
        result = await addEvent(
          toolInput as Parameters<typeof addEvent>[0]
        );
        break;

      case "update_event":
        action = "Updated event";
        result = await updateEvent(
          toolInput as Parameters<typeof updateEvent>[0]
        );
        break;

      case "delete_event":
        action = "Deleted event";
        result = await deleteEvent(
          toolInput as Parameters<typeof deleteEvent>[0]
        );
        break;

      case "create_announcement":
        action = "Created announcement";
        result = await addAnnouncement(
          toolInput as Parameters<typeof addAnnouncement>[0]
        );
        break;

      case "update_hours":
        action = "Updated hours";
        result = await updateHours(
          toolInput as Parameters<typeof updateHours>[0]
        );
        break;

      case "add_closure":
        action = "Added closure";
        result = await addClosure(
          toolInput as Parameters<typeof addClosure>[0]
        );
        break;

      case "create_staff_pick":
        action = "Created staff pick";
        result = await addStaffPick(
          toolInput as Parameters<typeof addStaffPick>[0]
        );
        break;

      case "update_page_content":
        action = "Updated page content";
        result = await updatePageContent(
          toolInput as Parameters<typeof updatePageContent>[0]
        );
        break;

      case "upload_image":
        action = "Uploaded image";
        result = {
          url: `/images/uploads/${(toolInput as { filename: string }).filename}`,
          altText: (toolInput as { alt_text: string }).alt_text,
          message: "Image upload placeholder — file storage not yet configured.",
        };
        break;

      case "send_newsletter_draft":
        action = "Drafted newsletter";
        result = {
          draft: true,
          subject: (toolInput as { subject: string }).subject,
          message:
            "Newsletter draft saved. Email sending integration not yet configured.",
        };
        break;

      case "get_analytics":
        action = "Viewed analytics";
        result = {
          period: (toolInput as { period: string }).period,
          pageViews: 0,
          uniqueVisitors: 0,
          message:
            "Analytics integration not yet configured. Connect your analytics provider to see real data.",
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${toolName}` },
          { status: 400 }
        );
    }

    // Log the action to audit trail
    await logAudit(
      session.userId,
      session.displayName,
      action,
      toolName,
      toolInput,
      result
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";

    // Log the error too
    await logAudit(
      session.userId,
      session.displayName,
      `Error: ${message}`,
      toolName,
      toolInput,
      { error: message }
    );

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
