import { NextRequest, NextResponse } from "next/server";
import { sendRoomBookingConfirmation } from "@/lib/email/resend";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { organization, contactName, email, phone, date, startTime, endTime, attendance, purpose } = body;

  if (!organization || !contactName || !email || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Store in Supabase
    await supabase.from("form_submissions").insert({
      form_type: "room_booking",
      data: { organization, contactName, email, phone, date, startTime, endTime, attendance, purpose },
    });

    await sendRoomBookingConfirmation(email, {
      organization,
      contactName,
      email,
      phone: phone || undefined,
      date,
      startTime,
      endTime,
      attendance: attendance || undefined,
      purpose: purpose || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Room Form] Error:", err);
    return NextResponse.json(
      { error: "Failed to process request. Please call (903) 886-6858." },
      { status: 500 }
    );
  }
}
