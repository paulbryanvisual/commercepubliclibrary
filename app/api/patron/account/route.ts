import { NextResponse } from "next/server";
import { getPatronAccount } from "@/lib/atriuum/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

const PATRON_SECRET = new TextEncoder().encode(
  process.env.PATRON_JWT_SECRET || process.env.SESSION_SECRET || "patron-fallback-secret"
);
const PATRON_COOKIE = "cpl_patron_session";

/** GET — get full patron account info (checkouts, holds, fines) */
export async function GET() {
  try {
    // Verify patron session
    const cookieStore = await cookies();
    const token = cookieStore.get(PATRON_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, PATRON_SECRET);
    const patronBarcode = payload.patronId as string;

    // Get full account details from Atriuum
    const account = await getPatronAccount(patronBarcode);

    if (!account) {
      return NextResponse.json({ error: "Patron not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      patron: {
        name: account.name,
        email: account.email,
        phone: account.phone,
        cardNumber: account.barcode,
        patronClass: account.patronClass,
        cardExpires: account.cardExpires,
        cardExpired: account.cardExpired,
        isBlocked: account.isBlocked,
        address: `${account.address}, ${account.city}, ${account.state} ${account.zip}`,
      },
      counts: {
        itemsOut: account.itemsOut,
        overdue: account.totalOverdue,
      },
      fines: {
        total: account.totalFines,
        projectedLateFees: account.projectedLateFee,
      },
      items: account.materialsOut.map((item) => ({
        title: item.title,
        barcode: item.barcode,
        callNumber: item.callNumber,
        dueDate: item.dueDate,
        checkoutDate: item.checkoutDate,
        isOverdue: item.isOverdue,
        author: item.author,
        materialType: item.materialType,
        renewalCount: item.renewalCount,
        finesOwed: item.finesOwed,
      })),
    });
  } catch (err: unknown) {
    console.error("Patron account error:", err);
    return NextResponse.json(
      { error: "Unable to retrieve account info. Please try again later." },
      { status: 503 }
    );
  }
}
