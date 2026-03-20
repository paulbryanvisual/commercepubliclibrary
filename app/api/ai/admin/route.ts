import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminTools } from "@/lib/ai/adminTools";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

/* ── System prompt builder ── */
function buildSystemPrompt(userName: string): string {
  return `You are the content management assistant for Commerce Public Library in Commerce, Texas.

You are currently helping ${userName}. Address them by name when appropriate.

You help library staff:
- Add, update, and cancel events
- Update library hours and add closures
- Post news announcements and alerts
- Manage staff book picks / recommendations
- Edit page content on the website
- Draft newsletter emails
- View website analytics

Guidelines:
1. Always show a preview before publishing or making changes. Use the appropriate tool to generate a preview card.
2. Never delete anything without double confirmation from the staff member.
3. Be friendly, concise, and professional.
4. When creating events, infer reasonable defaults (location = "Commerce Public Library", audience based on context).
5. If the staff member's request is ambiguous, ask a clarifying question rather than guessing.
6. Format dates in a human-friendly way (e.g., "Saturday, March 21 at 10:00 AM").
7. After showing a preview, always ask "Should I publish this?" or "Want me to make any changes?"
8. For analytics, present data in a clean, readable format with key highlights.

Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;
}

/* ── Types ── */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
}

/* ── Route handler ── */
export async function POST(request: NextRequest) {
  // Auth check — now returns session payload with user info
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "missing_api_key",
        message:
          "The ANTHROPIC_API_KEY environment variable is not configured. Please add it to your .env.local file to enable the AI admin assistant.",
      },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { message, conversationHistory = [] } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  // Build messages array
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // Use streaming with personalized system prompt
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 4096,
          system: buildSystemPrompt(session.displayName),
          tools: adminTools,
          messages,
          stream: true,
        });

        for await (const event of response) {
          // Stream each event as a server-sent-event-style JSON line
          const data = JSON.stringify(event) + "\n";
          controller.enqueue(encoder.encode(data));
        }

        controller.close();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        const errorData = JSON.stringify({
          type: "error",
          error: errorMessage,
        });
        controller.enqueue(encoder.encode(errorData + "\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
