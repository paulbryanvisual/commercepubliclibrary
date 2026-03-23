import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const STYLE_SUFFIXES: Record<string, string> = {
  photorealistic: "photorealistic, high quality photography, 4k, natural lighting",
  illustration: "digital illustration, vibrant colors, clean lines, editorial style",
  watercolor: "watercolor painting, soft edges, pastel tones, artistic",
  "flat-design": "flat design, minimal, vector style, clean shapes",
};

const RATIO_SIZES: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1024, height: 576 },
  "4:3": { width: 1024, height: 768 },
  "1:1": { width: 1024, height: 1024 },
  "3:2": { width: 1024, height: 683 },
};

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    prompt,
    style = "photorealistic",
    aspect_ratio = "16:9",
    purpose = "",
  } = await request.json();

  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const geminiKey = process.env.GEMINI_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY;
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  const styleSuffix = STYLE_SUFFIXES[style] || STYLE_SUFFIXES.photorealistic;
  const fullPrompt = [purpose && `For a ${purpose}:`, prompt, styleSuffix]
    .filter(Boolean)
    .join(". ");

  const { width, height } = RATIO_SIZES[aspect_ratio] || RATIO_SIZES["16:9"];

  /* ── Try Imagen 4 via Google AI (highest quality) ── */
  if (geminiKey) {
    try {
      // Map aspect_ratio to Imagen format
      const imagenAspectRatio = aspect_ratio === "1:1" ? "1:1"
        : aspect_ratio === "4:3" ? "4:3"
        : aspect_ratio === "3:2" ? "3:2"
        : "16:9";

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: fullPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: imagenAspectRatio,
              safetyFilterLevel: "block_few",
              personGeneration: "allow_adult",
            },
          }),
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();
        const prediction = data.predictions?.[0];
        if (!prediction) console.log("Imagen 4: no predictions returned (likely safety filter) — falling through");
        if (prediction?.bytesBase64Encoded) {
          const url = await uploadToStorage(
            prediction.bytesBase64Encoded,
            prediction.mimeType || "image/png",
            "generated",
            prompt
          );
          return NextResponse.json({ url, source: "imagen-4", prompt: fullPrompt });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Imagen 4 error:", res.status, JSON.stringify(err));
      }
    } catch (e) {
      console.error("Imagen 4 exception:", e);
      // fall through
    }
  }

  /* ── Try Together.ai (Flux Schnell — free tier) ── */
  if (togetherKey) {
    try {
      const res = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${togetherKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell-Free",
          prompt: fullPrompt,
          width,
          height,
          steps: 4,
          n: 1,
          response_format: "b64_json",
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) {
          const url = await uploadToStorage(b64, "image/png", "generated", prompt);
          return NextResponse.json({ url, source: "together-flux", prompt: fullPrompt });
        }
      }
    } catch {
      // fall through
    }
  }

  /* ── Try HuggingFace Inference API ── */
  if (hfKey) {
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: fullPrompt }),
          cache: "no-store",
        }
      );
      if (res.ok) {
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const b64 = Buffer.from(arrayBuffer).toString("base64");
        const url = await uploadToStorage(b64, "image/png", "generated", prompt);
        return NextResponse.json({ url, source: "huggingface-sdxl", prompt: fullPrompt });
      }
    } catch {
      // fall through
    }
  }

  /* ── Fallback: curated Unsplash photo ── */
  const fallbackUrl = `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=${width}&q=80`;
  return NextResponse.json({
    url: fallbackUrl,
    source: "unsplash-fallback",
    prompt: fullPrompt,
    note: "Add GEMINI_API_KEY to .env.local for AI image generation (free at aistudio.google.com). Also supports TOGETHER_API_KEY or HUGGINGFACE_API_KEY.",
  });
}

async function uploadToStorage(b64: string, mediaType: string, category: string, prompt: string): Promise<string> {
  const supabase = createServiceClient();
  const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const ext = mediaType.includes("jpeg") ? "jpg" : "png";
  const path = `${category}/${slug}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(b64, "base64");
  const { error } = await supabase.storage
    .from("cms-images")
    .upload(path, buffer, { contentType: mediaType, upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("cms-images").getPublicUrl(path);
  return data.publicUrl;
}
