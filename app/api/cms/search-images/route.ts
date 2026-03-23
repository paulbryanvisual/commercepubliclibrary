import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/adminAuth";

export const runtime = "nodejs";

/* Curated fallback images by topic for when no API key is configured */
const CURATED: Record<string, string[]> = {
  default: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80",
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80",
  ],
  children: [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80",
    "https://images.unsplash.com/photo-1574537754389-c01d8e4a9e1d?w=1200&q=80",
    "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=1200&q=80",
  ],
  seniors: [
    "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=1200&q=80",
    "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1200&q=80",
    "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=1200&q=80",
  ],
  community: [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
    "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=1200&q=80",
    "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=1200&q=80",
  ],
  reading: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80",
    "https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=1200&q=80",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80",
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&q=80",
  ],
  technology: [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=80",
  ],
};

function pickCurated(query: string, count: number) {
  const q = query.toLowerCase();
  let pool = CURATED.default;
  if (q.match(/child|kid|story|preschool|youth/)) pool = CURATED.children;
  else if (q.match(/senior|elder|adult|age/)) pool = CURATED.seniors;
  else if (q.match(/community|event|group|volunteer/)) pool = CURATED.community;
  else if (q.match(/read|book|novel|fiction/)) pool = CURATED.reading;
  else if (q.match(/tech|computer|digital|code/)) pool = CURATED.technology;
  return pool.slice(0, count).map((url, i) => ({
    url,
    thumb: url.replace("w=1200", "w=400"),
    description: `${query} photo ${i + 1}`,
    credit: "Unsplash",
  }));
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, count = 4, orientation = "landscape" } = await request.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  /* ── Try Unsplash API if key is set ── */
  if (accessKey) {
    try {
      const params = new URLSearchParams({
        query,
        per_page: String(Math.min(count, 6)),
        orientation,
        content_filter: "high",
      });
      const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
        headers: { Authorization: `Client-ID ${accessKey}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map((p: { urls: { regular: string; thumb: string }; alt_description: string; user: { name: string } }) => ({
          url: p.urls.regular,
          thumb: p.urls.thumb,
          description: p.alt_description || query,
          credit: `Photo by ${p.user.name} on Unsplash`,
        }));
        return NextResponse.json({ images: results, source: "unsplash" });
      }
    } catch {
      // fall through to curated
    }
  }

  /* ── Fallback: curated library-relevant images ── */
  const images = pickCurated(query, Math.min(count, 6));
  return NextResponse.json({ images, source: "curated" });
}
