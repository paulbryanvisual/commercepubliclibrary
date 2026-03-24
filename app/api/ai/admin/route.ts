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
- Edit page content on the website (text, headings, descriptions, hero sections)
- Draft newsletter emails
- View website analytics
- Upload and replace images on any page
- Search for stock photos using search_images
- Generate custom AI images using generate_image
- Redesign any section of any page using update_page_content
- Completely redesign pages by updating multiple sections in sequence

Guidelines:
1. Always show a preview before publishing or making changes. Use the appropriate tool to generate a preview card.
2. Never delete anything without double confirmation from the staff member.
3. Be friendly, concise, and professional.
4. When creating events, infer reasonable defaults (location = "Commerce Public Library", audience based on context).
5. If the staff member's request is ambiguous, ask a clarifying question rather than guessing. EXCEPTION: image requests — always immediately call search_images or generate_image rather than asking for clarification.
6. Format dates in a human-friendly way (e.g., "Saturday, March 21 at 10:00 AM").
7. After showing a preview, always ask "Should I publish this?" or "Want me to make any changes?"
8. For analytics, present data in a clean, readable format with key highlights.
9. When the user attaches an image, it is AUTOMATICALLY uploaded to storage before you receive the message. The message will contain a line like: "[Image URLs already uploaded to storage: filename.jpg → https://...]". IMMEDIATELY call update_page_content with that URL as the content value — for a homepage hero use page="home", section="hero_image", content="<the URL>". There is NO separate upload step. Do not call any other tool first.
10. For finding images: IMMEDIATELY call search_images — never give advice about where to find photos. Just search. The user sees clickable thumbnails. When they click "Use this photo" you'll receive the URL and must call update_page_content.
11. For generating images: IMMEDIATELY call generate_image with a detailed descriptive prompt. Never ask first. The user sees the result and clicks "Use this image". You'll receive the URL and must call update_page_content. IMPORTANT: For content involving children/youth/kids, ALWAYS use style="illustration" (not photorealistic) — the AI image model handles illustrated children's content better.
12. When a message contains "Use this image on the page: https://..." or similar, IMMEDIATELY call update_page_content with that URL. Infer the page/section from context (recent conversation) or ask if unclear.
13. For page redesigns: you can update multiple sections in one response by calling update_page_content multiple times — for the title, description, image, etc. Think comprehensively about what makes a great library webpage.
14. You CAN redesign entire pages. When asked to redesign, update_page_content for ALL relevant sections: hero_title, hero_description, hero_image, etc. Then search for or generate a fitting image.
15. You can SEE the current live content of the page the staff member is viewing — it is injected below the guidelines as "LIVE PAGE CONTENT". Use this to answer questions like "what does the page say?", "what's the hero image?", "what events are showing?" — answer directly from that data without calling any tool. Use read_page tool only when you need to check a DIFFERENT page than the one currently being viewed.

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

  // Fetch current page content so the AI can "see" what's on the page
  let livePageContext = "";
  try {
    const { getAllData } = await import("@/lib/cms/dataStore");
    const cmsData = await getAllData();
    const pageSlug = currentPage === "/" ? "home" : (currentPage?.replace(/^\//, "") || "home");
    const pageContent = cmsData.pageContent[pageSlug] || {};
    const now = new Date();

    const sections = Object.entries(pageContent)
      .map(([k, v]) => `  ${k}: ${v.length > 120 ? v.slice(0, 120) + "…" : v}`)
      .join("\n");

    const upcomingEvents = cmsData.events
      .filter(e => new Date(e.date) >= now && !e.cancelled)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8)
      .map(e => `  - [id:${e.id}] ${e.title} (${e.date} ${e.startTime}, ${e.audience})`)
      .join("\n");

    const announcements = cmsData.announcements
      .slice(0, 5)
      .map(a => `  - [id:${a.id}] [${a.type}] ${a.title}: ${a.body.slice(0, 80)}…`)
      .join("\n");

    const closures = cmsData.closures
      .slice(0, 5)
      .map(c => `  - [id:${c.id}] ${c.title} (${c.startDate})`)
      .join("\n");

    livePageContext = `\n\n━━━ LIVE PAGE CONTENT (what the staff member sees on the right) ━━━
Page: ${pageSlug}
${sections ? `\nPage sections currently live:\n${sections}` : "\nNo custom page content saved yet."}
${upcomingEvents ? `\nUpcoming events (use these real IDs for update/delete):\n${upcomingEvents}` : ""}
${announcements ? `\nAnnouncements (use these real IDs for delete_announcement):\n${announcements}` : ""}
${closures ? `\nClosures (use these real IDs for delete_closure):\n${closures}` : ""}
IMPORTANT: Always use the [id:...] values above — never invent IDs.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } catch {
    // Non-fatal — proceed without page context
  }

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
          system: buildSystemPrompt(session.displayName, currentPage) + livePageContext,
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
