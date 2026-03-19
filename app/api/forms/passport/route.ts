import { NextRequest, NextResponse } from "next/server";
import { sendPassportConfirmation } from "@/lib/email/resend";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, email, phone, date, type, applicants } = body;

  if (!name || !email || !date || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Store in Supabase
    await supabase.from("form_submissions").insert({
      form_type: "passport",
      data: { name, email, phone, date, type, applicants: applicants || 1 },
    });

    // Send confirmation email (graceful if no Resend key)
    await sendPassportConfirmation(email, {
      name,
      email,
      phone: phone || undefined,
      date,
      type,
      applicants: applicants || 1,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Passport Form] Error:", err);
    return NextResponse.json(
      { error: "Failed to process request. Please call (903) 886-6858." },
      { status: 500 }
    );
  }
}
