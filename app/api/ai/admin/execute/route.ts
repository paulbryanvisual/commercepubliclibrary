import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";
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

export async function POST(request: NextRequest) {
  // Auth check
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isValid = await verifySession(sessionToken);
  if (!isValid) {
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

    switch (toolName) {
      case "create_event":
        result = await addEvent(
          toolInput as Parameters<typeof addEvent>[0]
        );
        break;

      case "update_event":
        result = await updateEvent(
          toolInput as Parameters<typeof updateEvent>[0]
        );
        break;

      case "delete_event":
        result = await deleteEvent(
          toolInput as Parameters<typeof deleteEvent>[0]
        );
        break;

      case "create_announcement":
        result = await addAnnouncement(
          toolInput as Parameters<typeof addAnnouncement>[0]
        );
        break;

      case "update_hours":
        result = await updateHours(
          toolInput as Parameters<typeof updateHours>[0]
        );
        break;

      case "add_closure":
        result = await addClosure(
          toolInput as Parameters<typeof addClosure>[0]
        );
        break;

      case "create_staff_pick":
        result = await addStaffPick(
          toolInput as Parameters<typeof addStaffPick>[0]
        );
        break;

      case "update_page_content":
        result = await updatePageContent(
          toolInput as Parameters<typeof updatePageContent>[0]
        );
        break;

      case "upload_image":
        // Placeholder — image upload requires file storage integration
        result = {
          url: `/images/uploads/${(toolInput as { filename: string }).filename}`,
          altText: (toolInput as { alt_text: string }).alt_text,
          message: "Image upload placeholder — file storage not yet configured.",
        };
        break;

      case "send_newsletter_draft":
        // Placeholder — newsletter sending requires email integration
        result = {
          draft: true,
          subject: (toolInput as { subject: string }).subject,
          message:
            "Newsletter draft saved. Email sending integration not yet configured.",
        };
        break;

      case "get_analytics":
        // Placeholder — analytics requires integration with analytics provider
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

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
