import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminTools } from "@/lib/ai/adminTools";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

/* ── Page context mapping ── */
const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "Homepage — hero image/banner, search bar, quick action cards (My Account, Get a Card, Book a Room, Passports), open/closed status, weekly hours, events carousel, and footer.",
  "/events": "Events listing page — shows all upcoming library events in a grid with images, dates, and descriptions.",
  "/services": "Services page — overview of all library services including passport services, meeting rooms, computers/WiFi, printing.",
  "/catalog": "Catalog search page — search interface for the library's book catalog.",
  "/about": "About page — library history, staff directory, mission statement, photos of the building and staff.",
  "/kids": "Kids zone page — children's programs, story time schedules, summer reading, educational resources.",
  "/digital": "Digital resources page — links to Libby/OverDrive, Hoopla, TexShare databases, and other online resources.",
  "/history": "Local history page — Commerce and Hunt County historical resources and archives.",
  "/get-card": "Get a Library Card page — online card application form.",
  "/services/passport": "Passport services page — appointment booking, requirements, fees, and hours for passport processing.",
  "/services/rooms": "Meeting rooms page — room booking form, room descriptions, availability, and policies.",
  "/account": "My Account page — patron login for checkouts, holds, and fines.",
};

/* ── System prompt builder ── */
function buildSystemPrompt(userName: string, currentPage?: string): string {
  const pageContext = currentPage && PAGE_DESCRIPTIONS[currentPage]
    ? `\n\nThe staff member is currently viewing: ${currentPage}\nPage description: ${PAGE_DESCRIPTIONS[currentPage]}\n\nWhen they refer to "this page", "the photo here", "the top image", "this section", etc., they are referring to the page shown in their live preview (${currentPage}). Use this context to understand their requests without asking which page they mean.`
    : currentPage
    ? `\n\nThe staff member is currently viewing: ${currentPage}. When they refer to "this page" or elements on it, they mean this page.`
    : "";

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
- Upload and replace images on any page

Guidelines:
1. Always show a preview before publishing or making changes. Use the appropriate tool to generate a preview card.
2. Never delete anything without double confirmation from the staff member.
3. Be friendly, concise, and professional.
4. When creating events, infer reasonable defaults (location = "Commerce Public Library", audience based on context).
5. If the staff member's request is ambiguous, ask a clarifying question rather than guessing.
6. Format dates in a human-friendly way (e.g., "Saturday, March 21 at 10:00 AM").
7. After showing a preview, always ask "Should I publish this?" or "Want me to make any changes?"
8. For analytics, present data in a clean, readable format with key highlights.
9. When the user attaches an image and references "this page" or a section of the page, use the current page context to understand exactly where the image should go. Don't ask which page — you already know.

Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.${pageContext}`;
}

/* ── Types ── */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ImageData {
  base64: string;
  mediaType: string;
  fileName: string;
}

interface RequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
  images?: ImageData[];
  currentPage?: string;
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

  const { message, conversationHistory = [], images = [], currentPage } = body;

  if ((!message || typeof message !== "string") && images.length === 0) {
    return NextResponse.json(
      { error: "message or images required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  // Build messages array
  const historyMessages: Anthropic.MessageParam[] = conversationHistory.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Build the current user message content (text + images)
  const userContent: Anthropic.ContentBlockParam[] = [];

  // Add images first so Claude sees them before the text
  for (const img of images) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: img.base64,
      },
    });
  }

  // Add the text message
  if (message) {
    userContent.push({
      type: "text",
      text: message,
    });
  }

  const messages: Anthropic.MessageParam[] = [
    ...historyMessages,
    { role: "user", content: userContent.length === 1 && userContent[0].type === "text" ? message : userContent },
  ];

  // Use streaming with personalized system prompt
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: buildSystemPrompt(session.displayName, currentPage),
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
