import { NextResponse } from "next/server";
import { fetchGoogleCalendarEvents } from "@/lib/googleCalendar";

export const revalidate = 300; // ISR: revalidate every 5 minutes

/**
 * GET /api/events
 * Returns events from the Commerce Public Library Google Calendar only.
 */
export async function GET() {
  const events = await fetchGoogleCalendarEvents(30, 90);

  return NextResponse.json({
    events,
    source: "google_calendar",
    count: events.length,
  });
}
