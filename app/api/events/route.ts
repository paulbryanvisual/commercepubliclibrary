import { NextResponse } from "next/server";
import { fetchGoogleCalendarEvents } from "@/lib/googleCalendar";
import { sampleEvents } from "@/lib/events";

export const revalidate = 300; // ISR: revalidate every 5 minutes

/**
 * GET /api/events
 * Returns events from Google Calendar, falling back to sample data.
 */
export async function GET() {
  const gcalEvents = await fetchGoogleCalendarEvents();

  // Use Google Calendar events if available, otherwise fall back to samples
  const events = gcalEvents.length > 0 ? gcalEvents : sampleEvents;

  return NextResponse.json({ events, source: gcalEvents.length > 0 ? "google_calendar" : "sample_data" });
}
