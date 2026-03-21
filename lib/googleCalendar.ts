/**
 * Fetch events from a public Google Calendar using the Calendar API.
 *
 * The calendar must be publicly accessible. We use the Google Calendar API v3
 * with an API key (or public access for public calendars).
 */

import type { LibraryEvent, Audience } from "./events";

const CALENDAR_ID =
  "859e3c81326afbac0619b08cab4166db0e90f7a2cffc72617330d2af4b0c7314@group.calendar.google.com";

const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

/** Shape of a Google Calendar event from the API */
interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  recurrence?: string[];
  status?: string;
}

/** Map a Google Calendar event to our LibraryEvent shape */
function mapGCalEvent(ev: GCalEvent): LibraryEvent | null {
  if (!ev.summary || ev.status === "cancelled") return null;

  const startDT = ev.start?.dateTime || ev.start?.date;
  const endDT = ev.end?.dateTime || ev.end?.date;
  if (!startDT) return null;

  const startDate = new Date(startDT);
  const endDate = endDT ? new Date(endDT) : startDate;

  // Build slug from title
  const slug =
    ev.summary
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    startDate.toISOString().slice(0, 10);

  // Parse audience from description tags like [kids], [teens], [adults], [all]
  const desc = ev.description || "";
  let audience: Audience = "all";
  const audienceMatch = desc.match(/\[(kids|teens|adults|seniors|all)\]/i);
  if (audienceMatch) {
    audience = audienceMatch[1].toLowerCase() as Audience;
  }

  // Check for registration requirement tag
  const registrationRequired = /\[registration\s*required\]/i.test(desc);

  // Clean description (remove tag markers)
  const cleanDesc = desc
    .replace(/\[(kids|teens|adults|seniors|all|registration\s*required)\]/gi, "")
    .trim();

  // Format times
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }); // YYYY-MM-DD

  return {
    slug,
    title: ev.summary,
    date: formatDate(startDate),
    startTime: ev.start?.dateTime ? formatTime(startDate) : "All Day",
    endTime: ev.end?.dateTime ? formatTime(endDate) : "",
    description: cleanDesc.slice(0, 150) || ev.summary,
    longDescription: cleanDesc || ev.summary,
    audience,
    location: ev.location || "Commerce Public Library",
    registrationRequired,
    recurring: ev.recurrence ? "Recurring" : undefined,
  };
}

/**
 * Fetch upcoming events from Google Calendar.
 * Falls back to empty array if API key is missing or request fails.
 */
export async function fetchGoogleCalendarEvents(
  maxResults = 20,
  daysAhead = 60
): Promise<LibraryEvent[]> {
  // If no API key, we can still try public calendar access
  const timeMin = new Date().toISOString();
  const timeMax = new Date(
    Date.now() + daysAhead * 24 * 60 * 60 * 1000
  ).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
    ...(API_KEY ? { key: API_KEY } : {}),
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 min
    if (!res.ok) {
      console.error(
        `[Google Calendar] API error ${res.status}: ${await res.text().catch(() => "")}`
      );
      return [];
    }

    const data = await res.json();
    const items: GCalEvent[] = data.items || [];

    return items
      .map(mapGCalEvent)
      .filter((e): e is LibraryEvent => e !== null);
  } catch (err) {
    console.error("[Google Calendar] Fetch failed:", err);
    return [];
  }
}
