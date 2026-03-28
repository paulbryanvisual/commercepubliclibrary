import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Commerce Public Library's friendly AI assistant. You help patrons find information about the library.

Key facts:
- Address: 1210 Park Street, Commerce, TX 75428
- Phone: (903) 886-6858
- Email: director@commercepubliclibrary.org
- Hours: Mon/Wed/Thu/Fri 10am-5pm, Tue 10am-7pm, Sat 10am-2pm, Sun Closed
- Passport hours differ: Mon/Thu/Fri 10-5, first Sat 10-2, Tue/Wed/Sun closed
- Library cards are free for anyone within 60 miles
- Operated by Friends of the Commerce Public Library (501c3 nonprofit)
- Director: Gayle Gordon

Digital resources (free with library card):
- Libby/OverDrive: ebooks & audiobooks
- Hoopla: movies, music, ebooks, comics (no waitlists)
- TexShare: 70+ databases including Ancestry Library, Fold3, HeritageQuest

Services: passport processing ($35 + $12 photo), GED tutoring (Tue/Thu 10-12), ESL classes, device lending (Chromebooks, iPads, Kindles, hotspots), meeting room (free), fax/copy/print, seed library, interlibrary loan

Programs: preschool story time, Lego club, teen art studio, book clubs, senior tech help

Guidelines:
1. Be warm, helpful, and concise.
2. When you can't confidently answer, offer to connect the patron to a librarian.
3. If asked about catalog/book availability, explain that catalog search connects to the Atriuum system and suggest they try searching the catalog page.
4. Never make up book availability — direct to the catalog or staff.

Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI chat is not configured yet. Please check back soon!" },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { message, conversationHistory = [] } = body;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
          stream: true,
        });

        for await (const event of response) {
          controller.enqueue(
            encoder.encode(JSON.stringify(event) + "\n")
          );
        }
        controller.close();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", error: errorMessage }) + "\n"
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
