import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = "cms-images";

export async function POST(request: NextRequest) {
  // Auth check
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { base64: string; mediaType: string; fileName: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { base64, mediaType, fileName, category = "general" } = body;

  if (!base64 || !mediaType || !fileName) {
    return NextResponse.json({ error: "base64, mediaType, and fileName are required" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();

    // Ensure bucket exists (creates it if not, silently ignores if it does)
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    // Build a clean, timestamped path
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const slug = fileName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60);
    const path = `${category}/${slug}-${Date.now()}.${ext}`;

    // Decode base64 → Buffer
    const buffer = Buffer.from(base64, "base64");

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mediaType,
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
