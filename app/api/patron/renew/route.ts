import { NextRequest, NextResponse } from "next/server";
import { renewItem } from "@/lib/sip2/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

const PATRON_SECRET = new TextEncoder().encode(
  process.env.PATRON_JWT_SECRET || process.env.SESSION_SECRET || "patron-fallback-secret"
);
const PATRON_COOKIE = "cpl_patron_session";

/** POST — renew a checked-out item */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PATRON_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated. Please log in first." }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, PATRON_SECRET);
    const patronId = payload.patronId as string;

    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const result = await renewItem(patronId, "", itemId);

    if (!result.ok) {
      return NextResponse.json({
        error: "Unable to renew item",
        message: result.screenMessage || "The item could not be renewed.",
      }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      renewal: {
        itemId: result.itemId,
        title: result.titleId,
        dueDate: result.dueDate,
      },
      message: result.screenMessage || "Item renewed successfully!",
    });
  } catch (err: unknown) {
    console.error("Renew error:", err);
    return NextResponse.json(
      { error: "Unable to connect to library system. Please try again later." },
      { status: 503 }
    );
  }
}
