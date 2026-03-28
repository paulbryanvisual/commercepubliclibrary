import { NextRequest, NextResponse } from "next/server";
import { patronLogin, getPatronAccount } from "@/lib/atriuum/client";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const runtime = "nodejs";

const PATRON_SECRET = new TextEncoder().encode(
  process.env.PATRON_JWT_SECRET || process.env.SESSION_SECRET || "patron-fallback-secret"
);
const PATRON_COOKIE = "cpl_patron_session";

/** POST — authenticate patron with library card + password */
export async function POST(req: NextRequest) {
  try {
    const { cardNumber, pin } = await req.json();

    if (!cardNumber || !pin) {
      return NextResponse.json({ error: "Card number and PIN are required" }, { status: 400 });
    }

    // Authenticate via Atriuum API
    const result = await patronLogin(cardNumber, pin);

    if (!result.success) {
      return NextResponse.json({
        error: "Invalid card number or password",
        message: result.error || "Authentication failed",
      }, { status: 401 });
    }

    // Get full account details
    const account = await getPatronAccount(cardNumber);

    // Create a patron session JWT
    const token = await new SignJWT({
      patronId: cardNumber,
      atriuumId: result.patronId,
      name: result.name,
      email: account?.email || "",
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
        name: result.name,
        email: account?.email || "",
        phone: account?.phone || "",
        cardNumber,
        overdueItems: account?.totalOverdue || 0,
        chargedItems: account?.itemsOut || 0,
        feeAmount: account?.totalFines || "$0.00",
        cardExpires: account?.cardExpires || "",
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
