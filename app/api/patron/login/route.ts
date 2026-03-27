import { NextRequest, NextResponse } from "next/server";
import { patronStatus } from "@/lib/sip2/client";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const runtime = "nodejs";

const PATRON_SECRET = new TextEncoder().encode(
  process.env.PATRON_JWT_SECRET || process.env.SESSION_SECRET || "patron-fallback-secret"
);
const PATRON_COOKIE = "cpl_patron_session";

/** POST — authenticate patron with library card + PIN */
export async function POST(req: NextRequest) {
  try {
    const { cardNumber, pin } = await req.json();

    if (!cardNumber || !pin) {
      return NextResponse.json({ error: "Card number and PIN are required" }, { status: 400 });
    }

    const status = await patronStatus(cardNumber, pin);

    if (!status.valid || !status.authenticated) {
      return NextResponse.json({
        error: "Invalid card number or PIN",
        message: status.screenMessage || "Authentication failed",
      }, { status: 401 });
    }

    // Create a patron session JWT
    const token = await new SignJWT({
      patronId: cardNumber,
      name: status.name,
      email: status.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(PATRON_SECRET);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(PATRON_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return NextResponse.json({
      ok: true,
      patron: {
        name: status.name,
        email: status.email,
        phone: status.phone,
        cardNumber,
        holdItems: status.holdItemsCount,
        overdueItems: status.overdueItemsCount,
        chargedItems: status.chargedItemsCount,
        fineItems: status.fineItemsCount,
        feeAmount: status.feeAmount,
      },
    });
  } catch (err: unknown) {
    console.error("Patron login error:", err);
    return NextResponse.json(
      { error: "Unable to connect to library system. Please try again later." },
      { status: 503 }
    );
  }
}

/** GET — check if patron is logged in (from cookie) */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PATRON_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, PATRON_SECRET);
    return NextResponse.json({
      authenticated: true,
      patron: {
        name: payload.name,
        email: payload.email,
        cardNumber: payload.patronId,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

/** DELETE — logout patron */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(PATRON_COOKIE);
  return NextResponse.json({ ok: true });
}
