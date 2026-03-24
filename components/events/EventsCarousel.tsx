"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { audienceConfig, type LibraryEvent, type Audience } from "@/lib/events";

export default function EventsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live events from Google Calendar only
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (data.events && data.events.length > 0) {
            setEvents(data.events.slice(0, 10));
          }
        }
      } catch {
        // No events available
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  const carouselEvents = events;

  // Don't render section at all if no events and done loading
  if (!isLoading && carouselEvents.length === 0) return null;

  return (
    <section className="relative">
      <div className="mx-auto max-w-site px-4 md:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              What&apos;s Happening
            </p>
            <h2 className="text-h2 text-gray-800">Upcoming Events</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:border-primary-border hover:text-primary transition-colors"
              aria-label="Scroll events left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:border-primary-border hover:text-primary transition-colors"
              aria-label="Scroll events right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <Link
              href="/events"
              className="ml-2 rounded-lg bg-primary-light px-4 py-2 text-sm font-medium text-primary-dark hover:bg-primary-200 transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-8 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Left spacer for max-w-site alignment */}
        <div className="shrink-0 w-[max(0px,calc((100vw-1200px)/2))]" />

        {carouselEvents.map((event, i) => {
          const config = audienceConfig[event.audience as Audience] || audienceConfig.all;
          const eventDate = new Date(event.date);
          const month = eventDate.toLocaleDateString("en-US", { month: "short" });
          const day = eventDate.getDate();
          const weekday = eventDate.toLocaleDateString("en-US", { weekday: "short" });

          return (
            <Link
              key={i}
              href={`/events/${event.slug}`}
              className="group min-w-[290px] max-w-[290px] snap-start rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-primary-border transition-all duration-300 overflow-hidden"
              data-cms-item="true"
              data-cms-item-type="event"
              data-cms-item-slug={event.slug}
              data-cms-item-title={event.title}
            >
              {/* 1:1 Event photo */}
              {event.image ? (
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={event.image}
                    alt={event.imageAlt || event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className={`aspect-square ${config.bg} flex items-center justify-center`}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </div>
              )}

              {/* Color accent bar */}
              <div className={`h-1 ${config.dot}`} />

              <div className="p-4">
                {/* Date + title */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-center shrink-0">
                    <p className="text-[10px] font-semibold text-primary uppercase">
                      {month}
                    </p>
                    <p className="text-xl font-bold text-gray-800 leading-none">
                      {day}
                    </p>
                    <p className="text-[10px] text-gray-400">{weekday}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-100 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 group-hover:text-primary-dark transition-colors truncate">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{event.startTime}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                  {event.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}
                  >
                    {config.label}
                  </span>
                  {event.recurring && (
                    <span className="text-[10px] text-gray-400">
                      {event.recurring}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {/* "See all" card */}
        <Link
          href="/events"
          className="min-w-[200px] snap-start rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-2 px-6 hover:border-primary-border hover:bg-primary-light transition-all"
        >
          <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>
          </div>
          <span className="text-sm font-medium text-gray-500">View all events</span>
        </Link>

        {/* Right spacer */}
        <div className="shrink-0 w-[max(0px,calc((100vw-1200px)/2))]" />
      </div>
    </section>
  );
}
