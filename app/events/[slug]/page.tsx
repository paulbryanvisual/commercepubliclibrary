import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  sampleEvents,
  getEventBySlug,
  getRelatedEvents,
  buildGoogleCalendarUrl,
  audienceConfig,
} from "@/lib/events";
import EventRegistrationForm from "./EventRegistrationForm";
import IcsDownloadButton from "./IcsDownloadButton";
import ShareButtons from "./ShareButtons";

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return sampleEvents.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const event = getEventBySlug(params.slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.description,
  };
}

export default function EventDetailPage({ params }: PageProps) {
  const event = getEventBySlug(params.slug);
  if (!event) notFound();

  const cfg = audienceConfig[event.audience];
  const related = getRelatedEvents(event);
  const gcalUrl = buildGoogleCalendarUrl(event);

  const eventDate = new Date(event.date + "T12:00:00");
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const spotsRemaining =
    event.spotsTotal && event.spotsTaken !== undefined
      ? event.spotsTotal - event.spotsTaken
      : null;

  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-8">
      {/* Back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to Events
      </Link>

      {/* Hero section */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm mb-8">
        {/* Color accent bar */}
        <div className={`h-2 ${cfg.dot}`} />

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-10">
            {/* Left: event info */}
            <div className="flex-1 min-w-0">
              {/* Date block */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-primary-light px-4 py-3 min-w-[72px]">
                  <span className="text-xs font-semibold text-primary uppercase">
                    {eventDate.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-3xl font-bold text-primary-dark leading-none">
                    {eventDate.getDate()}
                  </span>
                  <span className="text-xs text-primary-mid font-medium">
                    {eventDate.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>

                <div>
                  <h1 className="text-h1 text-gray-800 mb-1">{event.title}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    {event.recurring && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M23 4v6h-6M1 20v-6h6" />
                          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                        {event.recurring}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <DetailItem
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  }
                  label="Date"
                  value={formattedDate}
                />
                <DetailItem
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  }
                  label="Time"
                  value={`${event.startTime} – ${event.endTime}`}
                />
                <DetailItem
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  }
                  label="Location"
                  value={event.location}
                />
                <DetailItem
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  }
                  label="Registration"
                  value={
                    event.registrationRequired
                      ? spotsRemaining !== null
                        ? `Required — ${spotsRemaining} spot${spotsRemaining !== 1 ? "s" : ""} remaining`
                        : "Required"
                      : "Drop-in, no registration needed"
                  }
                />
              </div>

              {/* Spots progress */}
              {event.registrationRequired && event.spotsTotal && event.spotsTaken !== undefined && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>{event.spotsTaken} registered</span>
                    <span>{event.spotsTotal} total spots</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min((event.spotsTaken / event.spotsTotal) * 100, 100)}%` }}
                      role="progressbar"
                      aria-valuenow={event.spotsTaken}
                      aria-valuemin={0}
                      aria-valuemax={event.spotsTotal}
                      aria-label={`${event.spotsTaken} of ${event.spotsTotal} spots taken`}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-800 mb-2">About This Event</h2>
                <p className="text-body text-gray-600 leading-relaxed">{event.longDescription}</p>
              </div>

              {/* Calendar + share buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <a
                  href={gcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary-border hover:text-primary shadow-sm transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Add to Google Calendar
                </a>
                <IcsDownloadButton slug={event.slug} title={event.title} />
              </div>

              <ShareButtons title={event.title} slug={event.slug} />
            </div>

            {/* Right: registration form (if required) */}
            {event.registrationRequired && (
              <div className="lg:w-[380px] shrink-0 mt-8 lg:mt-0">
                <EventRegistrationForm eventTitle={event.title} eventSlug={event.slug} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related events */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-h3 text-gray-800 mb-4">
            More {cfg.label} Events
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((rel) => {
              const relCfg = audienceConfig[rel.audience];
              const relDate = new Date(rel.date + "T12:00:00");
              return (
                <Link
                  key={rel.slug}
                  href={`/events/${rel.slug}`}
                  className="group rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-border transition-all"
                >
                  <div className={`h-1.5 ${relCfg.dot}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-center min-w-[44px]">
                        <p className="text-[11px] font-semibold text-primary uppercase">
                          {relDate.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="text-xl font-bold text-gray-800 leading-none">
                          {relDate.getDate()}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-gray-100" />
                      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-primary-dark transition-colors">
                        {rel.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {rel.startTime} – {rel.endTime} &middot; {rel.location}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-2">{rel.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/** Small helper component for the detail grid */
function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
      <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
