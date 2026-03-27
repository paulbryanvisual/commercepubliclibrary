import { NextRequest, NextResponse } from "next/server";
import { patronInfo } from "@/lib/sip2/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

const PATRON_SECRET = new TextEncoder().encode(
  process.env.PATRON_JWT_SECRET || process.env.SESSION_SECRET || "patron-fallback-secret"
);
const PATRON_COOKIE = "cpl_patron_session";

/** GET — get full patron account info (checkouts, holds, fines) */
export async function GET(req: NextRequest) {
  try {
    // Verify patron session
    const cookieStore = await cookies();
    const token = cookieStore.get(PATRON_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, PATRON_SECRET);
    const patronId = payload.patronId as string;

    // What info to retrieve
    const url = new URL(req.url);
    const infoType = (url.searchParams.get("type") || "all") as
      | "hold"
      | "overdue"
      | "charged"
      | "fine"
      | "all";

    // We need the patron's PIN again for SIP2 — but we don't store it.
    // Use empty password; many SIP2 servers accept this for info requests
    // after the patron has been authenticated via the 63 message.
    // If this doesn't work, we'll need to store an encrypted PIN in the JWT.
    const info = await patronInfo(patronId, "", infoType);

    if (!info.valid) {
      return NextResponse.json({ error: "Patron not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      patron: {
        name: info.name,
        email: info.email,
        phone: info.phone,
        cardNumber: patronId,
        feeAmount: info.feeAmount,
      },
      counts: {
        holds: info.holdItemsCount,
        overdue: info.overdueItemsCount,
        charged: info.chargedItemsCount,
        fines: info.fineItemsCount,
        unavailableHolds: info.unavailableHoldsCount,
      },
      items: {
        holds: info.holdItems.filter(Boolean),
        overdue: info.overdueItems.filter(Boolean),
        charged: info.chargedItems.filter(Boolean),
        fines: info.fineItems.filter(Boolean),
      },
      screenMessage: info.screenMessage,
    });
  } catch (err: unknown) {
    console.error("Patron account error:", err);
    return NextResponse.json(
      { error: "Unable to retrieve account info. Please try again later." },
      { status: 503 }
    );
  }
}
