"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { type LibraryEvent, type Audience, audienceConfig } from "@/lib/events";
import CalendarView from "@/components/events/CalendarView";

interface EventsPageClientProps {
  events: LibraryEvent[];
}

const audiences: (Audience | "all")[] = ["all", "kids", "teens", "adults", "seniors"];

type ViewMode = "list" | "calendar";

/* ─── Featured Events Hero Carousel ─── */
function FeaturedHero({ events }: { events: LibraryEvent[] }) {
  const featured = useMemo(
    () => events.filter((e) => e.image).slice(0, 5),
    [events],
  );

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = featured.length;

  const next = useCallback(() => setActive((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setActive((i) => (i - 1 + count) % count), [count]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, count, next]);

  if (count === 0) return null;

  return (
    <section
      aria-label="Featured events"
      className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gray-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {featured.map((event, idx) => {
        const cfg = audienceConfig[event.audience];
        const eventDate = new Date(event.date + "T12:00:00");
        const isActive = idx === active;

        return (
          <div
            key={event.slug}
            aria-hidden={!isActive}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 10 : 0 }}
          >
            {/* Background image */}
            <img
              src={event.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="mx-auto max-w-site w-full px-4 md:px-8">
                <div className="max-w-xl">
                  {/* Audience badge */}
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3 ${cfg.bg} ${cfg.text}`}
                  >
                    {cfg.label}
                  </span>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                    {event.title}
                  </h2>

                  {/* Date & time */}
                  <p className="text-sm md:text-base text-white/80 mb-3">
                    {eventDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    &middot; {event.startTime} &ndash; {event.endTime}
                  </p>

                  {/* Description */}
                  <p className="text-sm md:text-base text-white/70 mb-5 line-clamp-2">
                    {event.description}
                  </p>

                  {/* CTA */}
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 px-5 py-2.5 text-sm font-semibold shadow hover:bg-gray-100 transition-colors"
                    tabIndex={isActive ? 0 : -1}
                  >
                    Learn More
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrow navigation */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous featured event"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next featured event"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === active
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Main Page ─── */
export default function EventsPageClient({ events }: EventsPageClientProps) {
  const [activeAudience, setActiveAudience] = useState<Audience | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const filteredEvents = useMemo(() => {
    if (activeAudience === "all") return events;
    return events.filter((e) => e.audience === activeAudience);
  }, [events, activeAudience]);

  return (
    <div>
      {/* Featured Events Hero Carousel */}
      <FeaturedHero events={events} />

      <div className="mx-auto max-w-site px-4 md:px-8 py-12">
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <h1 className="text-h1 text-gray-800 mb-4">Events & Programs</h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            All events are free and open to the public. From story times to book
            clubs, there&apos;s something for everyone.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter events by audience">
          {audiences.map((aud) => {
            const isActive = aud === activeAudience;
            const cfg = aud !== "all" ? audienceConfig[aud] : null;
            return (
              <button
                key={aud}
                onClick={() => setActiveAudience(aud)}
                aria-pressed={isActive}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cfg && (
                  <span
                    className={`inline-block h-2 w-2 rounded-full mr-1.5 ${isActive ? "bg-white/70" : cfg.dot}`}
                    aria-hidden="true"
                  />
                )}
                {aud === "all" ? "All Ages" : audienceConfig[aud].label}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-6">
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="tablist" aria-label="View mode">
            <button
              role="tab"
              aria-selected={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-white text-primary-dark shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                List
              </span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === "calendar"}
              onClick={() => setViewMode("calendar")}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-primary-dark shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Calendar
              </span>
            </button>
          </div>
          <span className="ml-auto text-sm text-gray-400">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Content area */}
        {viewMode === "list" ? (
          <EventListView events={filteredEvents} />
        ) : (
          <CalendarView events={filteredEvents} />
        )}
      </div>
    </div>
  );
}

/** List view rendering */
function EventListView({ events }: { events: LibraryEvent[] }) {
  return (
    <div className="space-y-4 mb-12" role="list">
      {events.map((event) => {
        const cfg = audienceConfig[event.audience];
        const eventDate = new Date(event.date + "T12:00:00");
        return (
          <Link
            key={event.slug}
            href={`/events/${event.slug}`}
            role="listitem"
            className="group block rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary-border hover:shadow-md transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Event image */}
              {event.image && (
                <div className="w-full sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={event.image}
                    alt={event.imageAlt || event.title}
                    className="w-full h-32 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Date block */}
              <div className="flex sm:flex-col items-center sm:items-center gap-2 sm:gap-0 sm:w-16 shrink-0 sm:text-center">
                <span className="text-sm font-semibold text-primary">
                  {eventDate.toLocaleDateString("en-US", { month: "short" })}
                </span>
                <span className="text-2xl font-semibold text-gray-800">
                  {eventDate.getDate()}
                </span>
                <span className="text-xs text-gray-400">
                  {eventDate.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-800 group-hover:text-primary-dark transition-colors">
                    {event.title}
                  </h3>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 ${cfg.bg} ${cfg.text}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  {event.startTime} – {event.endTime} &middot; {event.location}
                </p>
                <p className="text-sm text-gray-600">{event.description}</p>
                {event.recurring && (
                  <p className="text-xs text-gray-400 mt-1">
                    Recurring: {event.recurring}
                  </p>
                )}
              </div>

              {/* Registration badge + arrow */}
              <div className="flex items-center gap-3 sm:shrink-0">
                {event.registrationRequired && (
                  <span className="rounded-full bg-amber-light px-2.5 py-0.5 text-[11px] font-medium text-amber-text">
                    Registration
                  </span>
                )}
                <span className="text-gray-300 group-hover:text-primary transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        );
      })}

      {events.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No events match the selected filter.</p>
        </div>
      )}
    </div>
  );
}
