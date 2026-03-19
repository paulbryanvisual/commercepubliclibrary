import { NextRequest, NextResponse } from "next/server";
import { sendLibraryCardConfirmation } from "@/lib/email/resend";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { firstName, lastName, email, phone, address, city, state, zip, dob } = body;

  if (!firstName || !lastName || !email || !address || !dob) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Store in Supabase
    await supabase.from("form_submissions").insert({
      form_type: "library_card",
      data: { firstName, lastName, email, phone, address, city, state, zip, dob },
    });

    await sendLibraryCardConfirmation(email, {
      name: `${firstName} ${lastName}`,
      email,
    });

    // Also notify staff about the new application
    const { sendLibraryCardStaffNotification } = await import("@/lib/email/resend");
    await sendLibraryCardStaffNotification({
      firstName,
      lastName,
      email,
      phone: phone || "Not provided",
      address: `${address}, ${city || ""}, ${state || "TX"} ${zip || ""}`,
      dob,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Library Card Form] Error:", err);
    return NextResponse.json(
      { error: "Failed to process application. Please call (903) 886-6858." },
      { status: 500 }
    );
  }
}
