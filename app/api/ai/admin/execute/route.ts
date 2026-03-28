import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";
import { supabase } from "@/lib/supabase";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  addAnnouncement,
  deleteAnnouncement,
  addStaffPick,
  addClosure,
  deleteClosure,
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

/** Map tool names to their Supabase table names */
function getTableForTool(toolName: string): string | null {
  switch (toolName) {
    case "create_event":
    case "update_event":
      return "events";
    case "create_announcement":
      return "announcements";
    case "create_staff_pick":
      return "staff_picks";
    case "add_closure":
      return "closures";
    case "update_hours":
      return "hours_overrides";
    case "update_page_content":
      return "page_content";
    default:
      return null;
  }
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

  // Role-based access control — editors can only use CMS tools
  const EDITOR_ALLOWED_TOOLS = new Set([
    "update_page_content", "create_event", "update_event", "delete_event",
    "create_announcement", "delete_announcement", "create_staff_pick",
    "add_closure", "delete_closure", "update_hours",
    "search_images", "generate_image", "upload_image", "read_page",
  ]);
  const userRole = session.role || "editor";
  if (userRole !== "admin" && !EDITOR_ALLOWED_TOOLS.has(toolName)) {
    return NextResponse.json(
      { error: "This action requires admin access. Please contact an admin (Paul or Ashley)." },
      { status: 403 }
    );
  }

  try {
    let result: unknown;
    let action = "unknown";

    switch (toolName) {
      case "create_event":
        action = "Created event (draft)";
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
        action = "Created announcement (draft)";
        result = await addAnnouncement(
          toolInput as Parameters<typeof addAnnouncement>[0]
        );
        break;

      case "delete_announcement":
        action = "Deleted announcement";
        result = await deleteAnnouncement(
          toolInput as Parameters<typeof deleteAnnouncement>[0]
        );
        break;

      case "update_hours":
        action = "Updated hours (draft)";
        result = await updateHours(
          toolInput as Parameters<typeof updateHours>[0]
        );
        break;

      case "add_closure":
        action = "Added closure (draft)";
        result = await addClosure(
          toolInput as Parameters<typeof addClosure>[0]
        );
        break;

      case "delete_closure":
        action = "Deleted closure";
        result = await deleteClosure(
          toolInput as Parameters<typeof deleteClosure>[0]
        );
        break;

      case "create_staff_pick":
        action = "Created staff pick (draft)";
        result = await addStaffPick(
          toolInput as Parameters<typeof addStaffPick>[0]
        );
        break;

      case "update_page_content":
        action = "Updated page content (draft)";
        result = await updatePageContent(
          toolInput as Parameters<typeof updatePageContent>[0]
        );
        break;

      case "search_images":
        action = "Searched images";
        // Forwarded to /api/cms/search-images — handled client-side
        result = { deferred: true, tool: "search_images", input: toolInput };
        break;

      case "generate_image":
        action = "Generated image";
        // Forwarded to /api/cms/generate-image — handled client-side
        result = { deferred: true, tool: "generate_image", input: toolInput };
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

      case "read_page": {
        action = "Read page content";
        const { getAllData } = await import("@/lib/cms/dataStore");
        const cmsData = await getAllData();
        const targetPage = (toolInput as { page: string }).page || "home";
        const pageContent = cmsData.pageContent[targetPage] || {};
        const now = new Date();
        const upcomingEvents = cmsData.events
          .filter(e => new Date(e.date) >= now && !e.cancelled)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5)
          .map(e => ({ title: e.title, date: e.date, time: e.startTime, audience: e.audience, description: e.description.slice(0, 100) }));
        const activeAnnouncements = cmsData.announcements
          .filter(a => a.status === "published")
          .slice(0, 5)
          .map(a => ({ title: a.title, body: a.body.slice(0, 150), type: a.type }));
        result = {
          page: targetPage,
          pageContent,
          upcomingEvents: targetPage === "home" || targetPage === "events" ? upcomingEvents : undefined,
          announcements: targetPage === "home" ? activeAnnouncements : undefined,
          staffPicks: targetPage === "home" || targetPage === "about"
            ? cmsData.staffPicks.filter(s => s.status === "published").slice(0, 3).map(s => ({ title: s.title, author: s.author, staffName: s.staffName, review: s.review.slice(0, 100) }))
            : undefined,
        };
        break;
      }

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

    // Include table name and item ID for the publish step
    const table = getTableForTool(toolName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemId = (result as any)?.id || null;

    return NextResponse.json({
      success: true,
      result,
      // Draft metadata for publish flow
      draft: {
        table,
        id: itemId,
        status: "draft",
      },
    });
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
