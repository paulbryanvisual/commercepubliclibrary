import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
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
14. You CAN redesign entire pages. When asked to redesign, update_page_content for ALL relevant sections: hero_title, hero_subtitle, hero_description, hero_image, hero_bg_color, hero_accent_color, etc. Then search for or generate a fitting image.
15. You can SEE the current live content
16. COLOR SECTIONS — these accept any valid CSS color or gradient string. ALWAYS call update_page_content — do NOT put colors in text/description fields:
    HEADER / TOP BAR:
    - page="global", section="header_bg_color" → controls the top navigation bar background. Default is dark teal #114d3e. Examples: "#3B4A26" (dark olive), "#FF6B35" (orange), "#1a1a2e" (dark navy). When the user asks to change the "top bar", "header", "navigation", or "menu bar" color, use this.
    HERO / BANNER:
    - page="home", section="hero_bg_color" → controls the big hero/banner background. Accepts any CSS color or gradient.
    - page="home", section="hero_accent_color" → controls the subtitle highlight color in the hero.
    To reset any color to default, set its content to "" (empty string).
    Color reference: olive green="#556B2F", dark olive="#3B4A26", sage="#87AE73", orange="#FF6B35", navy="#1a1a2e". of the page the staff member is viewing — it is injected below the guidelines as "LIVE PAGE CONTENT". Use this to answer questions like "what does the page say?", "what's the hero image?", "what events are showing?" — answer directly from that data without calling any tool. Use read_page tool only when you need to check a DIFFERENT page than the one currently being viewed.

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
  model?: "claude" | "gemini";
}

/* ── Convert Anthropic tool schema → Gemini FunctionDeclaration ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anthropicToolsToGemini(tools: Anthropic.Tool[]): any[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: convertSchema(t.input_schema),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {};

  if (schema.type) out.type = String(schema.type).toUpperCase();
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.required) out.required = schema.required;

  if (schema.properties) {
    out.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, convertSchema(v)])
    );
  }
  if (schema.items) out.items = convertSchema(schema.items);

  return out;
}

/* ── Fetch live CMS context ── */
async function getLivePageContext(currentPage?: string): Promise<string> {
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

    return `\n\n━━━ LIVE PAGE CONTENT (what the staff member sees on the right) ━━━
Page: ${pageSlug}
${sections ? `\nPage sections currently live:\n${sections}` : "\nNo custom page content saved yet."}
${upcomingEvents ? `\nUpcoming events (use these real IDs for update/delete):\n${upcomingEvents}` : ""}
${announcements ? `\nAnnouncements (use these real IDs for delete_announcement):\n${announcements}` : ""}
${closures ? `\nClosures (use these real IDs for delete_closure):\n${closures}` : ""}
IMPORTANT: Always use the [id:...] values above — never invent IDs.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } catch {
    return "";
  }
}

/* ── Route handler ── */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { message, conversationHistory = [], images = [], currentPage, model = "claude" } = body;

  if ((!message || typeof message !== "string") && images.length === 0) {
    return NextResponse.json({ error: "message or images required" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(session.displayName, currentPage);
  const livePageContext = await getLivePageContext(currentPage);
  const fullSystem = systemPrompt + livePageContext;
  const encoder = new TextEncoder();

  /* ─── CLAUDE ─── */
  if (model === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "missing_api_key", message: "ANTHROPIC_API_KEY not configured." }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });

    const historyMessages: Anthropic.MessageParam[] = conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const userContent: Anthropic.ContentBlockParam[] = [];
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
    if (message) userContent.push({ type: "text", text: message });

    const messages: Anthropic.MessageParam[] = [
      ...historyMessages,
      { role: "user", content: userContent.length === 1 && userContent[0].type === "text" ? message : userContent },
    ];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: fullSystem,
            tools: adminTools,
            messages,
            stream: true,
          });
          for await (const event of response) {
            controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          }
          controller.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(encoder.encode(JSON.stringify({ type: "error", error: msg }) + "\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  /* ─── GEMINI ─── */
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "missing_api_key", message: "GEMINI_API_KEY not configured." }, { status: 503 });
  }

  const genai = new GoogleGenAI({ apiKey: geminiKey });
  const geminiTools = anthropicToolsToGemini(adminTools);

  // Build Gemini conversation history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geminiHistory: any[] = conversationHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Build current user message parts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userParts: any[] = [];
  for (const img of images) {
    userParts.push({ inlineData: { mimeType: img.mediaType, data: img.base64 } });
  }
  if (message) userParts.push({ text: message });

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to emit an event in the same format the client already parses
      const emit = (obj: object) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        const chat = genai.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: fullSystem,
            tools: [{ functionDeclarations: geminiTools }],
            maxOutputTokens: 4096,
          },
          history: geminiHistory,
        });

        const response = await chat.sendMessageStream({ message: userParts });

        let toolIndex = 0;

        for await (const chunk of response) {
          const candidate = chunk.candidates?.[0];
          if (!candidate?.content?.parts) continue;

          for (const part of candidate.content.parts) {
            if (part.text) {
              // Emit as Claude-compatible text_delta events
              emit({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
              emit({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: part.text } });
              emit({ type: "content_block_stop", index: 0 });
            }

            if (part.functionCall) {
              const toolId = `gemini_tool_${toolIndex++}`;
              emit({
                type: "content_block_start",
                index: toolIndex,
                content_block: { type: "tool_use", id: toolId, name: part.functionCall.name, input: {} },
              });
              emit({
                type: "content_block_delta",
                index: toolIndex,
                delta: { type: "input_json_delta", partial_json: JSON.stringify(part.functionCall.args || {}) },
              });
              emit({ type: "content_block_stop", index: toolIndex });
            }
          }
        }

        emit({ type: "message_stop" });
        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        emit({ type: "error", error: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
