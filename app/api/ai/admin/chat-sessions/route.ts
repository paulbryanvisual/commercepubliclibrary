import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

/** GET — list all chat sessions, or fetch a single session with messages via ?id= */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (sessionId) {
    // Single session with full messages
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, messages, created_at, updated_at")
      .eq("id", sessionId)
      .eq("user_id", session.userId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: data });
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, user_name, created_at, updated_at")
    .eq("user_id", session.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data });
}

/** POST — create or update a chat session */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    sessionId?: string;
    title?: string;
    messages?: unknown[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Update existing session
  if (body.sessionId) {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.title) updates.title = body.title;
    if (body.messages) updates.messages = JSON.stringify(body.messages);

    const { data, error } = await supabase
      .from("chat_sessions")
      .update(updates)
      .eq("id", body.sessionId)
      .eq("user_id", session.userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  }

  // Create new session
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: session.userId,
      user_name: session.displayName,
      title: body.title || "New conversation",
      messages: JSON.stringify(body.messages || []),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}

/** DELETE — delete a chat session */
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");
  if (!sessionId) {
    return NextResponse.json({ error: "Session id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", session.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
