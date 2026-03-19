import type { Metadata } from "next";
import { sampleEvents } from "@/lib/events";
import EventsPageClient from "./EventsPageClient";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Explore upcoming events at Commerce Public Library — story times, book clubs, GED tutoring, art workshops, and community programs.",
};

export default function EventsPage() {
  return <EventsPageClient events={sampleEvents} />;
}
