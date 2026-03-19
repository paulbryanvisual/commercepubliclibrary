"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type LibraryEvent, type Audience, audienceConfig } from "@/lib/events";

interface CalendarViewProps {
  events: LibraryEvent[];
}

/** Days-of-week header labels */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Get all days to render for a given month grid (including leading/trailing days) */
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const days: { date: Date; inMonth: boolean }[] = [];

  // Leading days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, inMonth: false });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({ date: new Date(year, month, i), inMonth: true });
  }

  // Trailing days to fill the last row
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
  }

  return days;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarView({ events }: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Map date keys to events
  const eventMap = useMemo(() => {
    const map: Record<string, LibraryEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const todayKey = toDateKey(today);

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayKey);
  };

  const selectedEvents = selectedDate ? eventMap[selectedDate] ?? [] : [];

  // Collect unique audiences for a date cell to show colored dots
  function getAudienceDots(dateKey: string): Audience[] {
    const evs = eventMap[dateKey];
    if (!evs) return [];
    const unique = Array.from(new Set(evs.map((e) => e.audience)));
    return unique as Audience[];
  }

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrev}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-primary-border hover:text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-800 min-w-[180px] text-center">
            {monthLabel}
          </h2>
          <button
            onClick={goToNext}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-primary-border hover:text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:border-primary-border hover:text-primary transition-colors"
        >
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(["kids", "teens", "adults", "seniors"] as Audience[]).map((aud) => {
          const cfg = audienceConfig[aud];
          return (
            <span key={aud} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
              <span className="text-gray-600">{cfg.label}</span>
            </span>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm" role="grid" aria-label={`Calendar for ${monthLabel}`}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50" role="row">
          {WEEKDAYS.map((day) => (
            <div key={day} role="columnheader" className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((cell, idx) => {
            const dateKey = toDateKey(cell.date);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const hasEvents = !!eventMap[dateKey];
            const dots = getAudienceDots(dateKey);

            return (
              <button
                key={idx}
                role="gridcell"
                aria-label={`${cell.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${hasEvents ? `, ${eventMap[dateKey]!.length} event${eventMap[dateKey]!.length > 1 ? "s" : ""}` : ""}`}
                aria-selected={isSelected}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={`
                  relative flex flex-col items-center justify-start py-2 sm:py-3 min-h-[52px] sm:min-h-[72px]
                  border-b border-r border-gray-100 transition-colors
                  ${!cell.inMonth ? "text-gray-300 bg-gray-50/50" : "text-gray-700"}
                  ${isSelected ? "bg-primary-light ring-2 ring-primary ring-inset" : ""}
                  ${isToday && !isSelected ? "bg-primary-50" : ""}
                  ${hasEvents && cell.inMonth ? "cursor-pointer hover:bg-primary-light/50" : "cursor-default"}
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset
                `}
              >
                <span
                  className={`
                    text-sm font-medium leading-none
                    ${isToday ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white" : ""}
                  `}
                >
                  {cell.date.getDate()}
                </span>
                {/* Event dots */}
                {dots.length > 0 && cell.inMonth && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center max-w-[40px]">
                    {dots.map((aud) => (
                      <span
                        key={aud}
                        className={`h-1.5 w-1.5 rounded-full ${audienceConfig[aud].dot}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}
                {/* Event count on larger screens */}
                {hasEvents && cell.inMonth && (
                  <span className="hidden sm:block mt-1 text-[10px] text-gray-400 font-medium">
                    {eventMap[dateKey]!.length} event{eventMap[dateKey]!.length > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDate && (
        <div className="animate-slide-up" role="region" aria-label={`Events for ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}>
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>

          {selectedEvents.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm text-gray-500">No events scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => {
                const cfg = audienceConfig[event.audience];
                return (
                  <Link
                    key={event.slug}
                    href={`/events/${event.slug}`}
                    className="group block rounded-2xl border border-gray-200 bg-white p-4 hover:border-primary-border hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-primary-dark transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.startTime} – {event.endTime} &middot; {event.location}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{event.description}</p>
                      </div>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text} shrink-0`}>
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
